# Logo Cardioline — arquivos e uso

Wordmark oficial, extraído de `cardioline.com/wp-content/uploads/2022/08/logo.png`
(600×38, o maior raster que a marca publica) e re-vetorizado com `potrace`
(`mkbitmap -x -f 12 -s 16 -t 0.5` → `potrace --flat -a 0.9 -O 1.0 -t 10 -u 16`).
Os PNG são renderizados **a partir do SVG** — não são upscale do raster original,
por isso ficam nítidos em qualquer tamanho.

Proporção fixa: **600 × 38** (≈ 15.79 : 1). Nunca distorcer.

## Qual arquivo usar

| Fundo do slide | Arquivo | Cor |
|---|---|---|
| **Branco** `#FFFFFF` ou cinza claro | `logo-orange.svg` / `.png` | `#F66201` |
| **Laranja** `#EE5B00` / `#F66201` | `logo-white.svg` / `.png` | `#FFFFFF` |
| **Navy** `#071046` (capa escura, encerramento) | `logo-white.svg` / `.png` | `#FFFFFF` |
| **Tint claro** `#FDEBE0` / `#F1F4FE` | `logo-navy.svg` / `.png` | `#071046` |

Regra de contraste: **sobre laranja, o logo é sempre branco.** O laranja sobre
laranja e o navy sobre laranja não passam em contraste e não são aprovados.

## Formatos

| Arquivo | Quando |
|---|---|
| `*.svg` | HTML e PDF — sempre a primeira escolha (vetor, escala infinita) |
| `*.png` (600×38) | header de slide (`--logo-w: 132px`) |
| `*-2x.png` (1200×76) | capa e encerramento (logo em ~300px) |
| `*-4x.png` (2400×152) | PPTX e qualquer saída para impressão |

O `build.mjs` embute o SVG como data-URI no HTML single-file.
O `export-pptx.mjs` usa os `-4x.png` — PowerPoint não renderiza SVG de forma
confiável em todas as versões.

## Tamanhos mínimos e área de respiro

- Largura mínima de reprodução: **96 px** (abaixo disso as contraformas fecham).
- Área de respiro: **altura do wordmark (38u) em todos os lados** — ou seja,
  um logo de 132 px de largura pede 8,4 px livres ao redor.
- No header dos slides o logo fica a 44 px da margem esquerda e 30 px do topo
  (ver `--logo-x` / `--logo-y` em `template/deck.css`).

## Proibido

- Recolorir para fora das quatro variantes desta pasta.
- Aplicar sombra, contorno, gradiente ou rotação.
- Usar o logo dentro de uma caixa/pílula colorida.
- Compor o wordmark com outra tipografia como se fosse lockup.
