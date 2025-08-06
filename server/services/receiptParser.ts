import OpenAI from "openai";
import fs from "fs";
import { storage } from "../storage";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

interface ParsedReceiptData {
  vendor: string;
  date: string;
  total: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    sku?: string;
  }>;
}

export async function parseReceiptWithAI(receiptId: string, filePath: string): Promise<void> {
  try {
    // Read the file and convert to base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = fileBuffer.toString('base64');

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      
      {
        "vendor": "store/vendor name",
        "date": "YYYY-MM-DD format",
        "total": "total amount as number",
        "lineItems": [
          {
            "description": "item description",
            "quantity": "quantity as number",
            "unitPrice": "unit price as number", 
            "totalPrice": "total price for this item as number",
            "sku": "SKU or item code if available"
          }
        ]
      }

      Important rules:
      1. If you find Home Depot "Pro Xtra" discount lines, subtract them from the item above and do not treat as separate items
      2. Extract individual line items, not just the total
      3. Convert all prices to numbers without currency symbols
      4. Use null for missing values
      5. Be precise with item descriptions
      6. Handle tax and discount lines appropriately
      
      Respond only with valid JSON.
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const parsedData: ParsedReceiptData = JSON.parse(response.choices[0].message.content || "{}");

    // Update the receipt with parsed data
    await storage.updateReceipt(receiptId, {
      vendor: parsedData.vendor,
      receiptDate: parsedData.date ? new Date(parsedData.date) : null,
      totalAmount: parsedData.total.toString(),
      parsedData: parsedData,
      aiParsed: true,
    });

    // Create receipt line items
    if (parsedData.lineItems && parsedData.lineItems.length > 0) {
      for (const item of parsedData.lineItems) {
        await storage.createReceiptLineItem({
          receiptId,
          description: item.description,
          quantity: item.quantity?.toString() || "1",
          unitPrice: item.unitPrice?.toString() || "0",
          totalPrice: item.totalPrice.toString(),
          sku: item.sku || null,
        });
      }
    }

  } catch (error) {
    console.error("AI parsing failed for receipt:", receiptId, error);
    
    // Mark receipt as failed parsing
    await storage.updateReceipt(receiptId, {
      aiParsed: false,
      parsedData: { error: "AI parsing failed" },
    });
  }
}
