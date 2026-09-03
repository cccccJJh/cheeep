# Cheeep

위시리스트에 사고 싶은 이름을 먼저 남기고, 매장에서 가격·구입처·사진을 이어서 찍습니다. 내가 기록한 것 중 최저가가 맨 위에 옵니다. 사진과 가격은 나중에 넣어도 됩니다. 로그인은 없고, 데이터는 이 브라우저에만 저장됩니다.

```bash
npm install
npm run dev
```

같은 Wi-Fi의 폰에서 터미널에 나온 주소로 접속한 뒤, 브라우저 메뉴에서 홈 화면에 추가할 수 있습니다.

GitHub Pages: https://cccccJJh.github.io/cheeep/

설정이 안 열리거나 저장이 안 되면, Actions가 `gh-pages` 브랜치를 만든 뒤에 아래만 고르면 됩니다.

1. 저장소 **Settings** → 왼쪽 **Pages**
2. **Source**를 **Deploy from a branch** 로
3. Branch는 **gh-pages**, folder는 **/ (root)**
4. **Save**

`main` 브랜치를 소스로 두면 Vite 원본이 올라가서 사이트가 깨집니다. GitHub Actions 소스는 첫 배포 전에 저장이 안 되는 경우가 있습니다.
