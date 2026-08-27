# Imagens de equipamento

Renders oficiais baixados de `cardioline.com` (`wp-content/uploads/2025/11/*-cover.png`
e `2026/02/*`), reduzidos para 900px de largura e convertidos para WebP com
`cwebp -q 90 -alpha_q 100`. **Fundo transparente** — feitos para cair sobre o
branco do slide sem moldura e sem sombra.

| Arquivo | O que é |
|---|---|
| `ecg100s.webp` | ECG100S — eletrocardiógrafo de 12 derivações, com impressora e teclado |
| `touchecg-windows.webp` | TouchECG rodando em estação Windows (monitor) |
| `touchecg-digital.webp` | TouchECG na versão digital / web |
| `cubeholter.webp` | cubeholter — software de análise de Holter |
| `cubeabpm.webp` | cubeabpm — software de MAPA (monitorização ambulatorial da pressão) |
| `cubestress.webp` | cubestress — sistema de ergometria / teste de esforço |
| `ecg-webapp.webp` | ECG WebApp — leitura e laudo no navegador |
| `ecg-webapp-holter.webp` | ECG WebApp na visão de Holter |
| `cardiopack.webp` | Cardiopack — conjunto de acessórios e consumíveis |
| `vireo-flex.webp` | VIREO Flex |

## Uso

```html
<figure class="figure device">
  <img src="../assets/devices/ecg100s.webp" alt="Eletrocardiógrafo Cardioline ECG100S">
  <figcaption>ECG100S — eletrocardiógrafo de 12 derivações</figcaption>
</figure>
```

Variantes do contêiner: `.device` (solto no branco, o padrão),
`.device.is-tint` (sobre `#FDEBE0`), `.device.is-framed` (borda de 1px).

Sempre preencha o `alt` — ele vira o texto alternativo do objeto no PPTX.

## WebP e PPTX

O HTML e o PDF leem WebP direto. O `export-pptx.mjs` converte para PNG na hora,
usando `dwebp` (libwebp) ou `sips` (macOS). Sem nenhum dos dois o export avisa e
segue sem a imagem — instale com `brew install webp`.

## Adicionar uma imagem nova

1. Prefira o render oficial do site ao invés de foto de catálogo.
2. Reduza para 900px na maior dimensão: `sips -Z 900 in.png --out out.png`.
3. Converta: `cwebp -q 90 -alpha_q 100 out.png -o nome.webp`.
4. Registre na tabela acima — a linha é o que diz ao próximo o que é a imagem.

Não recorte o produto na mão nem force fundo branco chapado: o alpha é o que
permite usar a mesma imagem sobre branco, tint e navy.
