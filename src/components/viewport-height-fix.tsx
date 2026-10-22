"use client";

import { useEffect } from "react";

/**
 * iOS Safari không co `dvh` lại khi bàn phím ảo hiện lên (chỉ co khi
 * ẩn/hiện thanh địa chỉ) — đây là giới hạn riêng của WebKit. Phải tự theo
 * dõi `visualViewport` (API báo đúng vùng hiển thị thực tế, có tính cả bàn
 * phím) rồi gán vào biến CSS để layout co giãn đúng.
 */
export function ViewportHeightFix() {
  useEffect(() => {
    function update() {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${vh}px`);
    }

    update();
    window.visualViewport?.addEventListener("resize", update);
    window.addEventListener("resize", update);
    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
}
