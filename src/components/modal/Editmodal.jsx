import React, { useState, useEffect } from "react";
import { Button, Modal, Form, Input, Row, Col, message, Select, Switch } from "antd";
import { useUpdateProductMutation } from "../../context/service/addproduct.service";

const EditProductModal = ({ visible, onCancel, product, usdRate, isStore }) => {
  const [editForm] = Form.useForm(); // Tahrirlash formasi hook
  const [updateProduct] = useUpdateProductMutation(); // Mahsulotni yangilash uchun API chaqiruv hook
  const [editingProduct, setEditingProduct] = useState(product); // Hozir tahrirlanayotgan mahsulot
  const [purchaseSum, setPurchaseSum] = useState(true)
  const [sellSum, setSellSum] = useState(true)

  useEffect(() => {
    if (product) {
      setEditingProduct(product);
      editForm.setFieldsValue({
        ...product,
        purchase_price: product.purchase_price,
        sell_price: product.sell_price,
      });
      setPurchaseSum(product.purchase_currency === "uzs");
      setSellSum(product.sell_currency === "uzs");
    }
  }, [product, usdRate, editForm]);

  const handleEditFinish = async (values) => {
    console.log(values);

    try {
      if (isStore) {
        delete values.stock
      }
      const purchasePriceSom = values.purchase_price;
      const sellPriceSom = values.sell_price;
      await updateProduct({
        id: editingProduct._id,
        ...values,
        purchase_currency: purchaseSum ? "uzs" : "usd",
        sell_currency: sellSum ? "uzs" : "usd",
        purchase_price: purchasePriceSom,
        sell_price: sellPriceSom,
      }).unwrap();
      message.success("Mahsulot muvaffaqiyatli tahrirlandi!");
      onCancel();
      editForm.resetFields();
    } catch (error) {
      message.error("Xato yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  };

  return (
    <Modal
      title="Mahsulotni tahrirlash"
      open={visible}
      onCancel={() => {
        onCancel();
        editForm.resetFields();
      }}
      footer={null}
    >
      <Form layout="vertical" form={editForm} onFinish={handleEditFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Mahsulot nomi1"
              name="product_name"
              rules={[{ required: true, message: "Majburiy maydon!" }]}
            >
              <Input placeholder="Mahsulot nomi" autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Modeli"
              name="model"
              rules={[{ required: true, message: "Majburiy maydon!" }]}
            >
              <Input placeholder="Modeli" autoComplete="off" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          {!isStore && (
            <Col span={12}>
              <Form.Item
                label="Miqdor"
                name="stock"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <Input type="number" placeholder="Miqdor" autoComplete="off" />
              </Form.Item>
            </Col>
          )}
        </Row>
        <Row gutter={16} style={{ maxHeight: "65px" }}>
          <Col span={12}>
            <Form.Item
              label="Sotib olish narxi"
              name="purchase_price"
              rules={[{ required: true, message: "Majburiy maydon!" }]}
            >
              <Input
                type="number"
                placeholder="Sotib olish narxi"
                autoComplete="off"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Sotish narxi"
              name="sell_price"
              rules={[{ required: true, message: "Majburiy maydon!" }]}
            >
              <Input
                type="number"
                placeholder="Sotish narxi"
                autoComplete="off"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: "12px" }}>
          <Col style={{ display: "flex", gap: "6px" }} span={12}>
            <p>USD</p>
            <Switch
              checked={purchaseSum}
              onChange={(value) => setPurchaseSum(value)}
            />
            <p>UZS</p>
          </Col>
          <Col style={{ display: "flex", gap: "6px" }} span={12}>
            <p>USD</p>
            <Switch checked={sellSum} onChange={(value) => setSellSum(value)} />
            <p>UZS</p>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.Item
              label="Kimdan kelgan"
              name="kimdan_kelgan"
              rules={[{ required: true, message: "Majburiy maydon!" }]}
            >
              <Input placeholder="Kimdan kelgan" autoComplete="off" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="O'lchov birligi"
              name="count_type"
              rules={[{ required: true, message: "Majburiy maydon!" }]}
            >
              <Select placeholder="O'lchov birligi" autoComplete="off">
                <Select.Option value="dona">Dona</Select.Option>
                <Select.Option value="komplekt">Komplekt</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Shtrix kod"
              name="barcode"
              rules={[{ required: true, message: "Majburiy maydon!" }]}
            >
              <Input placeholder="Shtrix kod" autoComplete="off" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Saqlash
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProductModal;
