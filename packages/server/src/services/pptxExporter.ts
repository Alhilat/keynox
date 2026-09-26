/**
 * PPTX Presentation Exporter
 * Converts Presentation AST documents into standard PowerPoint (.pptx) files
 * using pptxgenjs.
 */

import pptxgen from "pptxgenjs";
import { Presentation, CardElement } from "@presentation/schema";

export async function exportPresentationToPptx(presentation: Presentation): Promise<Buffer> {
  const pptx = new pptxgen();

  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Keynox Presentation Engine";
  pptx.title = presentation.title || "Keynox Presentation";

  // Keynox Obsidian Dark Master Theme
  const bgColor = "0A0D14";
  const textColor = "F8FAFC";
  const mutedColor = "94A3B8";

  for (const scene of presentation.scenes) {
    const slide = pptx.addSlide();

    // Dark Background
    slide.background = { color: bgColor };

    // Slide Category Badge
    if (scene.category) {
      slide.addText(scene.category.toUpperCase(), {
        x: 0.8,
        y: 0.4,
        w: 10,
        h: 0.35,
        fontSize: 10,
        bold: true,
        color: "38BDF8",
        fontFace: "Arial",
      });
    }

    // Slide Title
    slide.addText(scene.title || "Untitled Slide", {
      x: 0.8,
      y: 0.8,
      w: 11.5,
      h: 0.7,
      fontSize: 24,
      bold: true,
      color: textColor,
      fontFace: "Arial",
    });

    // Subtitle
    if (scene.subtitle) {
      slide.addText(scene.subtitle, {
        x: 0.8,
        y: 1.55,
        w: 11.5,
        h: 0.5,
        fontSize: 13,
        color: mutedColor,
        fontFace: "Arial",
      });
    }

    // Cards / Elements Layout
    const cards = (scene.elements || []).filter((e) => e.type === "card") as CardElement[];
    if (cards.length > 0) {
      const startX = 0.8;
      const startY = 2.2;
      const totalWidth = 11.7; // Available slide width for 16:9 widescreen layout

      const cols = cards.length <= 3 ? cards.length : cards.length === 4 ? 2 : 3;
      const rows = Math.ceil(cards.length / cols);
      const cardWidth = (totalWidth - (cols - 1) * 0.3) / cols;
      const cardHeight = rows === 1 ? 4.4 : 2.1;

      cards.forEach((card, idx) => {
        const colIdx = idx % cols;
        const rowIdx = Math.floor(idx / cols);
        const xPos = startX + colIdx * (cardWidth + 0.3);
        const yPos = startY + rowIdx * (cardHeight + 0.25);
        const accentHex = (card.accentColor || "#38bdf8").replace("#", "");

        // Card Box Container
        slide.addShape("roundRect" as any, {
          x: xPos,
          y: yPos,
          w: cardWidth,
          h: cardHeight,
          fill: { color: "131A29" },
          line: { color: accentHex, width: 1.5 },
        });

        // Card Badge
        if (card.badge) {
          slide.addText(card.badge.toUpperCase(), {
            x: xPos + 0.2,
            y: yPos + 0.15,
            w: cardWidth - 0.4,
            h: 0.3,
            fontSize: 9,
            bold: true,
            color: accentHex,
            fontFace: "Arial",
          });
        }

        // Card Title
        const titleY = card.badge ? yPos + 0.45 : yPos + 0.2;
        slide.addText(card.title, {
          x: xPos + 0.2,
          y: titleY,
          w: cardWidth - 0.4,
          h: 0.4,
          fontSize: rows === 1 ? 15 : 13,
          bold: true,
          color: textColor,
          fontFace: "Arial",
        });

        // Card Description
        const descY = titleY + 0.45;
        if (card.description) {
          slide.addText(card.description, {
            x: xPos + 0.2,
            y: descY,
            w: cardWidth - 0.4,
            h: card.points && card.points.length > 0 ? 0.7 : cardHeight - (descY - yPos) - 0.2,
            fontSize: 11,
            color: mutedColor,
            fontFace: "Arial",
          });
        }

        // Bullet points
        if (card.points && card.points.length > 0) {
          const pointsY = card.description ? descY + 0.75 : descY;
          const bulletText = card.points.map((pt) => `• ${pt}`).join("\n");
          slide.addText(bulletText, {
            x: xPos + 0.2,
            y: pointsY,
            w: cardWidth - 0.4,
            h: Math.max(0.6, cardHeight - (pointsY - yPos) - 0.2),
            fontSize: 10.5,
            color: textColor,
            fontFace: "Arial",
          });
        }
      });
    }
  }

  const arrayBuffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return arrayBuffer;
}
