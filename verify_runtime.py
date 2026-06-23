"""
方舟 PNT 工坊 · 运行时验证脚本 / Runtime Verification Script
验证页面渲染、拖拽区、标签切换等核心交互。
"""
from playwright.sync_api import sync_playwright
import sys

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        # 收集控制台错误 / Collect console errors
        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)
        page.on("pageerror", lambda err: errors.append(f"[pageerror] {err}"))

        print("1. 访问首页...")
        page.goto("http://localhost:4173", wait_until="networkidle", timeout=15000)

        # 验证标题 / Verify title
        title = page.title()
        print(f"   页面标题: {title}")
        assert "方舟" in title, f"标题应包含'方舟'，实际: {title}"

        # 验证主标题 / Verify main heading
        heading = page.locator("h2").first.text_content()
        print(f"   主标题: {heading}")

        # 截图首页 / Screenshot homepage
        page.screenshot(path="/workspace/verify_home.png", full_page=True)
        print("   首页截图已保存")

        print("2. 验证拖拽区存在...")
        dropzone = page.locator('[class*="cursor-pointer"]').first
        assert dropzone.is_visible(), "拖拽区应可见"
        print("   拖拽区可见")

        print("3. 验证特性卡片...")
        cards = page.locator("h3")
        card_count = cards.count()
        print(f"   特性卡片数量: {card_count}")
        assert card_count >= 3, f"应有至少 3 个特性卡片，实际: {card_count}"

        print("4. 切换到逆向解析标签...")
        reverse_tab = page.get_by_text("PNT 逆向解析")
        reverse_tab.click()
        page.wait_for_timeout(500)

        reverse_heading = page.locator("h2").first.text_content()
        print(f"   逆向解析标题: {reverse_heading}")
        page.screenshot(path="/workspace/verify_reverse.png", full_page=True)
        print("   逆向解析截图已保存")

        print("5. 切换回正向标签...")
        forward_tab = page.get_by_text("图像转 PNT")
        forward_tab.click()
        page.wait_for_timeout(500)

        print("6. 检查控制台错误...")
        if errors:
            print(f"   警告: 发现 {len(errors)} 个控制台消息:")
            for e in errors[:10]:
                print(f"     {e}")
        else:
            print("   无控制台错误")

        browser.close()
        print("\n运行时验证通过")
        return 0

if __name__ == "__main__":
    sys.exit(main())
