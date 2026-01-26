import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { sanitizeString } from '@/lib/input-sanitizer';
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
    const address = searchParams.get("address");

    if (!address) {
      return createValidationError("Address parameter is required");
    }

    // Input sanitization
    const sanitizedAddress = sanitizeString(address, 500); // Max 500 karakter
    if (!sanitizedAddress || sanitizedAddress.length < 2) {
      return createValidationError("Address must be at least 2 characters");
    }

    // Harici API'ye istek at
    const apiUrl = process.env.ADRES_API_URL;
    const apiToken = process.env.ADRES_API_TOKEN;

    if (!apiUrl || !apiToken) {
      safeLogError(new Error('API URL or token not found'), 'Geocode Search API');
      return createErrorResponse(
        new Error('Configuration error'),
        'Configuration error',
        500
      );
    }

    // Token'ı query parameter olarak gönder
    const url = `${apiUrl}?token=${apiToken}&query=${encodeURIComponent(sanitizedAddress)}`;

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
      safeLogError(new Error(`External API error: ${response.status}`), 'Geocode Search API');
      return createErrorResponse(
        new Error('External API request failed'),
        'External service error',
        response.status >= 500 ? 502 : response.status
      );
    }

    const rawData = await response.json();

    // API'den gelen veriyi işle
    const results = rawData.sonuc_kumesi || [];

    if (results.length === 0) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    // Tüm sonuçları standart formata çevir
    const formattedResults = results.map((sonuc: any) => ({
      posta_adresi: sonuc.posta_adresi || "",
      il: sonuc.il || "",
      ilce: sonuc.ilce || "",
      mah: sonuc.mah || "",
      sokak: sonuc.odak_birim || sonuc.sok_ad || "",
      pk: sonuc.pk || "",
      skor: sonuc.skor || "",
      bolge: sonuc.bolge || "",
      coordinates: {
        lat: parseFloat(sonuc.enlem) || 0,
        lng: parseFloat(sonuc.boylam) || 0,
      },
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    safeLogError(error, 'Geocode Search API');
    return createErrorResponse(error, 'Internal server error', 500);
  }
}
