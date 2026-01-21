import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
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
    const url = `${apiUrl}?token=${apiToken}&query=${encodeURIComponent(address)}`;

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
    console.error("Backend proxy - Geocode search hatası:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
