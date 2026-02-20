# デバッグ手順

## 問題の確認方法

1. ブラウザで以下のいずれかのページを開く：
   - https://www.igy-inc.jp/services/marketing.html
   - https://www.igy-inc.jp/services/ai.html
   - https://www.igy-inc.jp/services/analytics.html

2. F12キーを押して開発者ツールを開く

3. Elements（要素）タブで、`<header id="header">`を探す

4. そのheader要素に以下のクラスがあるか確認：
   - `header-scrolled` ← このクラスがあれば、ヘッダーは白い背景になるはず

5. もし`header-scrolled`クラスがない場合：
   - Consoleタブを開いて、エラーメッセージがないか確認
   - main.jsが正しく読み込まれているか確認

## 強制キャッシュクリア

- Windows/Linux: Ctrl + Shift + R
- Mac: Cmd + Shift + R

または

- Windows/Linux: Ctrl + F5
- Mac: Cmd + Option + R
