import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import path from "path";
import { getServerSession } from "next-auth/next"; // ✅ No authOptions import

export const dynamic = "force-dynamic"; // Prevent static generation issues

const dataDirectory = path.join(process.cwd(), "data");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // ✅ Get the session without authOptions
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: certificateId } = params;

    // 📄 Read certificate data
    const certificateData = await fs.readFile(
      path.join(dataDirectory, "certificates.json"),
      "utf8"
    );

    const certificates = JSON.parse(certificateData || "[]");
    const certificate = certificates.find(
      (cert: { id: string; userId: string }) =>
        cert.id === certificateId && cert.userId === session.user.id
    );

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found or unauthorized" },
        { status: 404 }
      );
    }

    // 🖼️ Convert base64 image data to buffer
    const imageBuffer = Buffer.from(certificate.imageData, "base64");

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("❌ Error retrieving certificate:", error);
    return NextResponse.json(
      { error: "Failed to retrieve certificate image" },
      { status: 500 }
    );
  }
}
