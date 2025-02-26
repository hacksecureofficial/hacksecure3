import { promises as fs } from "fs"
import { NextResponse } from "next/server"
import path from "path"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/auth.config"

const dataDirectory = path.join(process.cwd(), "data")

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const certificateId = params.id

  try {
    const certificateData = await fs.readFile(path.join(dataDirectory, "certificates.json"), "utf8")
    const certificates = JSON.parse(certificateData || "[]")
    const certificate = certificates.find((cert: any) => cert.id === certificateId)

    if (!certificate || certificate.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const imageBuffer = Buffer.from(certificate.imageData, "base64")
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to retrieve certificate image" }, { status: 500 })
  }
}
