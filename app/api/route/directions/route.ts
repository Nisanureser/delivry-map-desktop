/**
 * Google Maps Directions API Route
 * Server-side route for fetching directions
 * API key güvenliği için server-side'da tutulur
 */

import { NextRequest, NextResponse } from 'next/server';

interface DirectionsRequest {
  waypoints: Array<{ lat: number; lng: number }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: DirectionsRequest = await request.json();
    const { waypoints } = body;

    if (!waypoints || waypoints.length < 2) {
      return NextResponse.json(
        { error: 'En az 2 waypoint gerekli' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Google Maps API key bulunamadı');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    // Waypoint'leri Google Maps formatına çevir
    const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
    const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
    
    // Ara waypoint'ler varsa ekle
    const waypointsParam = waypoints.length > 2
      ? waypoints.slice(1, -1).map(wp => `${wp.lat},${wp.lng}`).join('|')
      : '';

    // Google Maps Directions API URL
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    if (waypointsParam) {
      url.searchParams.set('waypoints', waypointsParam);
    }
    url.searchParams.set('key', apiKey);
    url.searchParams.set('language', 'tr'); // Türkçe yanıt

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Google Maps API hatası:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Google Maps API request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Maps Directions API hatası:', data.status, data.error_message);
      return NextResponse.json(
        { 
          error: data.error_message || 'Directions API hatası',
          status: data.status 
        },
        { status: 400 }
      );
    }

    // Polyline'ı decode etmek için route'u döndür
    return NextResponse.json({
      routes: data.routes,
      status: data.status,
    });
  } catch (error) {
    console.error('Directions API hatası:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
