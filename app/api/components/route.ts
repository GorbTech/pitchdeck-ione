import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), '../gt-energy-platform/admin/database/admin.db');

interface Component {
  id: number;
  name: string;
  category: string;
  price: number;
  currency: string;
  unit: string;
  origin: string;
  tier: string;
  description: string;
}

// GET /api/components?origin=EU&category=MPPT
export async function GET(request: NextRequest) {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const { searchParams } = new URL(request.url);

    const origin = searchParams.get('origin'); // EU, USA, CHINA, ANY
    const category = searchParams.get('category');
    const tier = searchParams.get('tier'); // prototype, industrial
    const name = searchParams.get('name');

    let query = 'SELECT * FROM components WHERE 1=1';
    const params: string[] = [];

    if (origin) {
      // EU = EU only, World = any origin
      if (origin === 'EU') {
        query += ' AND origin = ?';
        params.push('EU');
      }
      // World allows any origin - no filter
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (tier) {
      query += ' AND tier = ?';
      params.push(tier);
    }

    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }

    query += ' ORDER BY tier DESC, price ASC';

    const components = db.prepare(query).all(...params) as Component[];
    db.close();

    return NextResponse.json({
      status: 'ok',
      components,
      count: components.length
    });
  } catch (error) {
    console.error('Components API error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Database error'
    }, { status: 500 });
  }
}

// Helper to get best component for a category and origin preference
export async function getBestComponent(
  category: string,
  originPreference: 'EU' | 'World',
  tier?: 'prototype' | 'industrial'
): Promise<Component | null> {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    let query = 'SELECT * FROM components WHERE category = ?';
    const params: (string | undefined)[] = [category];

    if (originPreference === 'EU') {
      query += ' AND origin = ?';
      params.push('EU');
    }

    if (tier) {
      query += ' AND tier = ?';
      params.push(tier);
    }

    // Prefer prototype tier for accessibility, then by price
    query += ' ORDER BY CASE WHEN tier = "prototype" THEN 0 ELSE 1 END, price ASC LIMIT 1';

    const component = db.prepare(query).get(...params) as Component | undefined;
    db.close();

    return component || null;
  } catch {
    return null;
  }
}
