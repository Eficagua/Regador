import { NextResponse } from "next/server"
import { proveedoresConfigurados } from "@/lib/oauth"

export function GET() {
  return NextResponse.json(proveedoresConfigurados())
}
