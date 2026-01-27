/**
 * Google Maps Directions API Route
 * Server-side route for fetching directions
 * API key güvenliği için server-side'da tutulur
 */

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";
import { sanitizeCoordinate, validateBodySize } from "@/lib/input-sanitizer";
import {
  createErrorResponse,
  createValidationError,
  createTimeoutError,
  safeLogError,
} from "@/lib/error-handler";

interface DirectionsRequest {
  waypoints: Array<{ lat: number; lng: number }>;
  optimize?: boolean; // En kısa rota için optimize et
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 20 istek / 1 dakika
    const rateLimitResult = await checkRateLimit(request, {
      limit: 20,
      window: "1 m",
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.reset);
    }

    // Request body'yi oku (sadece bir kez!)
    let rawBody: string;
    let body: DirectionsRequest;

    try {
      rawBody = await request.text();

      // Body size kontrolü
      if (!validateBodySize(rawBody, 10 * 1024)) {
        // 10KB limit
        return createValidationError("Request body too large");
      }

      // JSON parse et
      body = JSON.parse(rawBody) as DirectionsRequest;
    } catch (parseError) {
      return createValidationError(
        `Invalid JSON format: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      );
    }

    const { waypoints, optimize = false } = body;

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return createValidationError("En az 2 waypoint gerekli");
    }

    // Waypoint limit kontrolü (DoS koruması)
    if (waypoints.length > 25) {
      return createValidationError("Maximum 25 waypoints allowed");
    }

    // Waypoint validation
    for (const waypoint of waypoints) {
      if (
        typeof waypoint !== "object" ||
        waypoint === null ||
        typeof waypoint.lat !== "number" ||
        typeof waypoint.lng !== "number"
      ) {
        return createValidationError("Invalid waypoint format");
      }

      const lat = sanitizeCoordinate(waypoint.lat, -90, 90);
      const lng = sanitizeCoordinate(waypoint.lng, -180, 180);

      if (lat === null || lng === null) {
        return createValidationError("Invalid coordinates");
      }
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      safeLogError(
        new Error("Google Maps API key not found"),
        "Directions API",
      );
      return createErrorResponse(
        new Error("Configuration error"),
        "Configuration error",
        500,
      );
    }

    // Waypoint'leri Google Maps formatına çevir
    // Not: Google Directions API'de optimize:true, origin ve destination'ı sabit tutar;
    // sadece ara waypoint'leri optimize eder.
    const origin = `${waypoints[0].lat},${waypoints[0].lng}`;

    let destination: string;
    let waypointsParam: string;

    if (optimize && waypoints.length > 2) {
      // En kısa rota: Origin = ilk nokta, Destination = son nokta, ara waypoint'ler optimize edilir
      destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
      const intermediate = waypoints.slice(1, -1);
      waypointsParam =
        intermediate.length > 0
          ? "optimize:true|" +
            intermediate.map((wp) => `${wp.lat},${wp.lng}`).join("|")
          : "";
    } else {
      // Öncelik sırasına göre: Origin = ilk nokta, destination = son nokta, ara waypoint'ler optimize edilmez
      destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
      waypointsParam =
        waypoints.length > 2
          ? waypoints
              .slice(1, -1)
              .map((wp) => `${wp.lat},${wp.lng}`)
              .join("|")
          : "";
    }

    // Google Maps Directions API URL
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    if (waypointsParam) {
      url.searchParams.set("waypoints", waypointsParam);
    }
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", "tr");
    url.searchParams.set("region", "tr"); // Türkiye yol ağına göre rota

    // Timeout ekle (15 saniye - Google Maps API daha uzun sürebilir)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return createTimeoutError();
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      safeLogError(
        new Error(`Google Maps API error: ${response.status}`),
        "Directions API",
      );
      return createErrorResponse(
        new Error("Google Maps API request failed"),
        "External service error",
        response.status >= 500 ? 502 : response.status,
      );
    }

    const data = await response.json();

    if (data.status !== "OK") {
      safeLogError(
        new Error(`Google Maps Directions API error: ${data.status}`),
        "Directions API",
      );
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development"
              ? data.error_message || "Directions API hatası"
              : "Directions API error",
          status: data.status,
        },
        { status: 400 },
      );
    }

    // Polyline'ı decode etmek için route'u döndür
    // Optimize edilmiş rota için waypoint_order bilgisini de döndür
    return NextResponse.json({
      routes: data.routes,
      status: data.status,
      waypoint_order: data.routes[0]?.waypoint_order || null, // Optimize edilmiş sıra
    });
  } catch (error) {
    safeLogError(error, "Directions API");
    return createErrorResponse(error, "Internal server error", 500);
  }
}
