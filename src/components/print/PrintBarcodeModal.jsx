import React, { useEffect, useRef } from "react";
import { Modal, Button } from "antd";
import JsBarcode from "jsbarcode";

const PrintBarcodeModal = ({
  visible,
  onCancel,
  barcode,
  productName,
  price,
}) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (visible && barcode) {
      try {
        JsBarcode(barcodeRef.current, barcode, {
          format: "CODE128",
          width: 2, // Har bir chiziqning kengligi (pikselda)
          height: 70, // Shtrix kodning balandligi (pikselda)
          displayValue: true, // Shtrix kod ostida raqam ko'rsatish
          fontSize: 14, // Raqamning shrift o'lchami
          margin: 5, // Chegaralar
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [visible, barcode]);

  useEffect(() => {
    console.log("Modal holati o'zgardi:", visible);
  }, [visible]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank"); // Yangi oyna ochish
    const printContent = barcodeRef.current.outerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              flex-direction: column; 
              height: 100vh; 
              font-family: Arial, sans-serif; 
              text-align: center;
            }
            svg { 
              width: 30mm !important; /* 3 sm kenglik */
              height: 20mm !important; /* 2 sm balandlik */
            }
            .product-info {
              margin-top: 5px;
              font-size: 12px;
              display: flex;
              justify-content: center;
              gap: 10px; /* Bo'shliq product name va price o'rtasida */
            }
            .product-name {
              font-weight: bold;
            }
            .product-price {
              font-weight: normal;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <div class="product-info">
            <div class="product-name">${
              productName || "Noma'lum mahsulot"
            }</div>
            <div class="product-price">${
              price ? price.toLocaleString() + " so'm" : "Narx mavjud emas"
            }</div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Modal
      title=""
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Bekor qilish
        </Button>,
        <Button key="submit" type="primary" onClick={handlePrint}>
          Chop etish
        </Button>,
      ]}
    >
      <div style={{ textAlign: "center" }}>
        <svg ref={barcodeRef}></svg>
        <div
          style={{
            marginTop: 5,
            fontSize: 12,
            display: "flex",
            justifyContent: "center",
            gap: 10, // Bo'shliq product name va price o'rtasida
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            {productName || "Noma'lum mahsulot"}
          </div>
          <div>
            {price ? price.toLocaleString() + " so'm" : "Narx mavjud emas"}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PrintBarcodeModal;
