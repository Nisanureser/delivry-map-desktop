import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Lat and lng parameters are required" },
        { status: 400 }
      );
    }

    // Input validation - koordinat değerlerini kontrol et
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json(
        { error: "Invalid coordinates format" },
        { status: 400 }
      );
    }

    // Koordinat aralığı kontrolü
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return NextResponse.json(
        { error: "Coordinates out of valid range" },
        { status: 400 }
      );
    }

    // Harici API'ye istek at
    const apiUrl = process.env.ADRES_API_URL;
    const apiToken = process.env.ADRES_API_TOKEN;

    if (!apiUrl || !apiToken) {
      console.error('API URL veya token bulunamadı');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    // Token'ı query parameter olarak gönder
    const url = `${apiUrl}?token=${apiToken}&query=${latNum},${lngNum}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Harici API hatası:", response.status, response.statusText);
      return NextResponse.json(
        { error: "External API request failed" },
        { status: response.status }
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
    console.error("Backend proxy - Reverse geocode hatası:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
