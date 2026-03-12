"use client";
import { useEffect } from "react";

interface AdBannerProps {
  dataAdSlot: string;
  dataAdFormat: string;
  dataFullWidthResponsive: boolean;
}

export default function AdBanner({ dataAdSlot, dataAdFormat, dataFullWidthResponsive }: AdBannerProps) {
  useEffect(() => {
    try {
      // This tells Google to fill the empty <ins> tag with a real ad
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (error: any) {
      console.error("AdSense error:", error.message);
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-4 overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your real Publisher ID
        data-ad-slot={dataAdSlot} // The specific Ad Unit ID Google gives you
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      />
    </div>
  );
}