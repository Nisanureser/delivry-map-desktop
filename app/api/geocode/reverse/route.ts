import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { sanitizeCoordinate } from '@/lib/input-sanitizer';
import { createErrorResponse, createValidationError, createTimeoutError, safeLogError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - 30 istek / 1 dakika
    const rateLimitResult = await checkRateLimit(request, {
      limit: 30,
      window: '1 m',
    });

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.reset);
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return createValidationError("Lat and lng parameters are required");
    }

    // Input validation - koordinat değerlerini kontrol et
    const latNum = sanitizeCoordinate(lat, -90, 90);
    const lngNum = sanitizeCoordinate(lng, -180, 180);

    if (latNum === null || lngNum === null) {
      return createValidationError("Invalid coordinates format or out of valid range");
    }

    // Harici API'ye istek at
    const apiUrl = process.env.ADRES_API_URL;
    const apiToken = process.env.ADRES_API_TOKEN;

    if (!apiUrl || !apiToken) {
      safeLogError(new Error('API URL or token not found'), 'Geocode Reverse API');
      return createErrorResponse(
        new Error('Configuration error'),
        'Configuration error',
        500
      );
    }

    // Token'ı query parameter olarak gönder
    const url = `${apiUrl}?token=${apiToken}&query=${latNum},${lngNum}`;

    // Timeout ekle (10 saniye)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return createTimeoutError();
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      safeLogError(new Error(`External API error: ${response.status}`), 'Geocode Reverse API');
      return createErrorResponse(
        new Error('External API request failed'),
        'External service error',
        response.status >= 500 ? 502 : response.status
      );
    }

    const rawData = await response.json();

    // API'den gelen veriyi işle
    const sonuc =
      rawData.sonuc_kumesi && rawData.sonuc_kumesi[0]
        ? rawData.sonuc_kumesi[0]
        : null;

    if (!sonuc) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Ham veriyi işleyerek standart formata çevir
    const result = {
      posta_adresi: sonuc.posta_adresi || `${lat}, ${lng}`,
      il: sonuc.il || "",
      ilce: sonuc.ilce || "",
      mah: sonuc.mah || "",
      sokak: sonuc.odak_birim || sonuc.sok_ad || "",
      pk: sonuc.pk || "",
      skor: sonuc.skor || "",
      bolge: sonuc.bolge || "",
      coordinates: {
        lat: parseFloat(sonuc.enlem) || parseFloat(lat),
        lng: parseFloat(sonuc.boylam) || parseFloat(lng),
      },
      raw_data: rawData,
    };

    return NextResponse.json({ result });
  } catch (error) {
    safeLogError(error, 'Geocode Reverse API');
    return createErrorResponse(error, 'Internal server error', 500);
  }
}
