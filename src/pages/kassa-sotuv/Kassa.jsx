import React, { useRef, useState, useEffect } from "react";
import {
  Input,
  Table,
  Card,
  Button,
  Modal,
  Select,
  message,
  Form,
  Input as AntdInput,
  DatePicker,
  AutoComplete,
} from "antd";
import {
  useGetAllProductsQuery,
  useUpdateProductMutation,
} from "../../context/service/addproduct.service";
import { useRecordSaleMutation } from "../../context/service/sale.service";
import {
  useSellProductFromStoreMutation,
  useGetStoreProductsQuery,
} from "../../context/service/store.service";
import {
  useCreateDebtorMutation,
  useGetDebtorsQuery,
} from "../../context/service/debtor.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import "./Kassa.css";
import Qarzdor from "../qarzdorlar/Qarzdor";
import Xarajatlar from "../Xarajatlar/Xarajatlar";
import { useReactToPrint } from "react-to-print";
import moment from "moment-timezone";
import Vazvrat from "../vazvrat/Vazvrat";
import bir from "../../assets/qr_telegram_ilyosxon (1).png";
import SotuvTarix from "../sotuv-tarix/Sotuv_tarix";
const { Option } = Select;

export default function Kassa() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("naqd");
  const [debtorName, setDebtorName] = useState("");
  const [debtorPhone, setDebtorPhone] = useState("");
  const [chekModal, setChekModal] = useState(false);
  const [qarzdorModalVisible, setQarzdorModalVisible] = useState(false);
  const [sotuvModalVisible, setSotuvModalVisible] = useState(false);
  const [xarajatlarModalVisible, setXarajatlarModalVisible] = useState(false);
  const [vazvratModalVisible, setVazvratModalVisible] = useState(false);
  const receiptRef = useRef();
  const [debtDueDate, setDebtDueDate] = useState(null);
  const { data: products, isLoading } = useGetAllProductsQuery();
  const { data: storeProducts } = useGetStoreProductsQuery();
  const { data: usdRateData } = useGetUsdRateQuery();
  const [updateProduct] = useUpdateProductMutation();
  const [recordSale] = useRecordSaleMutation();
  const [sellProductFromStore] = useSellProductFromStoreMutation();
  const [createDebtor] = useCreateDebtorMutation();
  const { data: debtors, refetch } = useGetDebtorsQuery();

  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [isBarcodeScan, setIsBarcodeScan] = useState(false);

  const uniqueDebtors = debtors?.reduce((acc, debtor) => {
    if (!acc.find((d) => d.phone === debtor.phone)) {
      acc.push(debtor);
    }
    return acc;
  }, []);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: "new document",
    pageStyle: "style",
    onAfterPrint: () => {
      setChekModal(false);
      setSelectedProducts([]);
    },
  });

  const filteredProducts = searchTerm
    ? products?.filter(
      (product) =>
        product.product_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.model &&
          product.model.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    : [];

  const handleSearchInput = (e) => {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastKeyTime;

    setSearchTerm(e.target.value);
    setLastKeyTime(currentTime);

    if (timeDiff < 50) {
      setIsBarcodeScan(true);
    } else {
      setIsBarcodeScan(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter" && isBarcodeScan) {
      e.preventDefault(); // Prevent form submission when scanning barcode
      const product = products?.find(
        (p) => p.barcode.toLowerCase() === searchTerm.toLowerCase()
      );
      if (product) {
        handleSelectProduct(product, true);
      } else {
        message.error("Mahsulot topilmadi!");
        setSearchTerm("");
      }
    }
  };

  const handleSelectProduct = (product, isBarcode = false) => {
    const exists = selectedProducts.find((item) => item._id === product._id);
    const storeProduct = storeProducts
      ? storeProducts.find((p) => p.product_id?._id === product._id)
      : null;

    if (!storeProduct) {
      message.error("Bu mahsulot dokonda mavjud emas!");
      return;
    }

    const dokonStock = storeProduct.quantity || 0;

    if (dokonStock === 0) {
      message.error("Bu mahsulot dokonda mavjud emas!");
      return;
    }

    if (!exists) {
      const updatedProducts = [
        ...selectedProducts,
        {
          ...product,
          quantity: product.count_type === "kg" ? 0 : 1,
          sell_price:
            product.sell_currency === "usd"
              ? product.sell_price * (usdRateData?.rate || 1)
              : product.sell_price,
        },
      ];
      setSelectedProducts(updatedProducts);

      if (isBarcode) {
        setSearchTerm("");
        setIsBarcodeScan(false);
      }
    } else {
      const updatedProducts = selectedProducts.map((item) => {
        if (item._id === product._id && item.count_type !== "kg") {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
      setSelectedProducts(updatedProducts);

      if (isBarcode) {
        setSearchTerm("");
        setIsBarcodeScan(false);
      } else {
        message.info("Bu mahsulot allaqachon tanlangan");
      }
    }
  };

  const handleRemoveProduct = (productId) => {
    const updatedProducts = selectedProducts.filter(
      (item) => item._id !== productId
    );
    setSelectedProducts(updatedProducts);
  };

  const handleQuantityChange = (productId, value) => {
    const updatedProducts = selectedProducts.map((item) => {
      if (item._id === productId) {
        if (item.count_type === "kg") {
          const newQuantity = parseFloat(value) || 0;
          return { ...item, quantity: newQuantity > 0 ? newQuantity : 0 };
        } else {
          const newQuantity = item.quantity + value;
          return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
        }
      }
      return item;
    });
    setSelectedProducts(updatedProducts);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const [receiptProducts, setReceiptProducts] = useState([]);

  const handleSellProducts = async () => {
    setChekModal(true);
    try {
      setReceiptProducts([...selectedProducts]);

      for (const product of selectedProducts) {
        const sellPrice =
          paymentMethod === "usd"
            ? product.sell_price * (usdRateData?.rate || 1)
            : product.sell_price;

        const storeProduct = storeProducts
          ? storeProducts.find((p) => p.product_id?._id === product._id)
          : null;
        if (!storeProduct) {
          message.error(
            `${product.product_name} mahsuloti dokonda mavjud emas!`
          );
          return;
        }
        if (storeProduct.quantity < product.quantity) {
          message.error(
            `${product.product_name} mahsuloti dokonda yetarli emas!`
          );
          return;
        }
        const newStoreStock = storeProduct.quantity - product.quantity;
        await sellProductFromStore({
          product_id: storeProduct.product_id._id,
          quantity: product.quantity,
        }).unwrap();

        if (paymentMethod === "qarz") {
          if (!debtorName || !debtorPhone) {
            message.error("Qarzga sotishda mijozning ismi va telefoni kerak!");
            return;
          }

          const debtor = {
            name: debtorName,
            phone: debtorPhone,
            debt_amount: sellPrice * product.quantity,
            due_date: debtDueDate,
            product_id: product._id,
            product_name: product.product_name,
            sell_price: sellPrice,
            product_quantity: product.quantity,
          };
          await createDebtor(debtor).unwrap();
        } else {
          const sale = {
            product_id: product._id,
            product_name: product.product_name,
            sell_price: sellPrice,
            buy_price: product.purchase_price,
            quantity: product.quantity,
            total_price: sellPrice * product.quantity,
            payment_method: paymentMethod,
            usd_rate: usdRateData?.rate || 1,
          };
          await recordSale(sale).unwrap();
        }
      }

      message.success("Mahsulotlar muvaffaqiyatli sotildi!");
      setSelectedProducts([]);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error:", error);
      message.error(
        `Xatolik: ${error.data?.message || "Serverga ulanishda xatolik"}`
      );
    }
  };

  const totalAmount = selectedProducts.reduce((acc, product) => {
    return acc + product.sell_price * product.quantity;
  }, 0);

  const handleSellPriceChange = (productId, newPrice) => {
    const updatedProducts = selectedProducts.map((item) => {
      if (item._id === productId) {
        return { ...item, sell_price: parseFloat(newPrice) || 0 };
      }
      return item;
    });
    setSelectedProducts(updatedProducts);
  };

  const debtorOptions = uniqueDebtors?.map((debtor) => ({
    value: debtor.name,
    label: `${debtor.name} (${debtor.phone})`,
    debtor,
  }));

  const handleDebtorSelect = (value, option) => {
    setDebtorName(option.debtor.name);
    setDebtorPhone(option.debtor.phone);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedProducts.length > 0) {
      showModal();
    }
  };

  // This function will handle Enter key press for the entire document
  const handleKeyDown = (e) => {
    // Only proceed if there are selected products and the key pressed is Enter
    if (e.key === 'Enter' && selectedProducts.length > 0 && !isModalVisible) {
      // Check if the active element is not the search input
      if (document.activeElement !== document.querySelector('input[placeholder="shtrix kodi, mahsulot nomi yoki modeli bo\'yicha qidirish..."]')) {
        e.preventDefault();
        showModal(); // Open the payment modal
      }
    }

    // Handle Enter key press in the payment modal
    if (e.key === 'Enter' && isModalVisible) {
      e.preventDefault();
      handleSellProducts(); // Confirm the payment
    }
  };

  // Add event listener for key down when component mounts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedProducts, isModalVisible, paymentMethod, debtorName, debtorPhone, debtDueDate]); // Re-add listener when these dependencies change

  return (
    <div className="kassa-container">
      <Modal
        open={chekModal}
        style={{ display: "flex", justifyContent: "center" }}
        onCancel={() => setChekModal(false)}
        footer={[
          <Button type="primary" onClick={handlePrint}>
            Chop etish
          </Button>,
        ]}
        title="To'lov cheki"
      >
        <div
          className="receipt"
          ref={receiptRef}
          style={{
            width: "80mm",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            paddingInline: "2px",
            gap: "6px",
            display: "flex",
          }}
        >
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            MED STORE DOʻKONI <br />
          </h1>
          <div className="chek_item">
            <b>
              Sana:{" "}
              <b>{moment().tz("Asia/Tashkent").format("DD.MM.YYYY HH:mm")}</b>
            </b>
          </div>
          <table className="table">
            <thead>
              <tr>
                <td>№</td>
                <td>Tovar</td>
                <td>Soni</td>
                <td>O'lchov</td>
                <td>Summa</td>
              </tr>
            </thead>
            <tbody>
              {receiptProducts?.map((item, index) => (
                <tr key={item._id}>
                  <td style={{ paddingBlock: "20px" }}>{index + 1}</td>
                  <td style={{ paddingBlock: "20px" }}>{item.product_name}</td>
                  <td style={{ paddingBlock: "20px" }}>{item.quantity}</td>
                  <td style={{ paddingBlock: "20px" }}>{item.count_type}</td>
                  <td style={{ paddingBlock: "20px" }}>
                    {(item.quantity * item.sell_price).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} style={{ border: "none" }}></td>
                <td>
                  <h1>Jami:</h1>
                  {receiptProducts
                    .reduce((a, b) => a + b.quantity * b.sell_price, 0)
                    .toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
          <p
            style={{
              fontSize: "20px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            <span>Xaridingiz uchun raxmat!!!</span> <br />
            <span>+998 94 138 33 33 </span> <br />
            <span>+998 88 926 04 04 </span> <br />
          </p>
          <p>
            {/* <img width={"200px"} src={bir} alt="" /> */}
          </p>
        </div>
      </Modal>

      <Modal
        title="Qarzdorlar"
        open={qarzdorModalVisible}
        onCancel={() => setQarzdorModalVisible(false)}
        footer={null}
        width="80%"
      >
        <Qarzdor />
      </Modal>

      <Modal
        title="Xarajatlar"
        open={xarajatlarModalVisible}
        onCancel={() => setXarajatlarModalVisible(false)}
        footer={null}
        width="80%"
      >
        <Xarajatlar />
      </Modal>

      <Modal
        title="Vazvrat tavarlar"
        open={vazvratModalVisible}
        onCancel={() => setVazvratModalVisible(false)}
        footer={null}
        width="80%"
      >
        <Vazvrat />
      </Modal>
      <Modal
        title="Sotish"
        open={sotuvModalVisible}
        onCancel={() => setSotuvModalVisible(false)}
        footer={null}
        width="80%"
      >
        <SotuvTarix />
      </Modal>

      <div className="kassa-header"
        style={{ backgroundColor: "#1a2a6b" }}
      >
        <Button
          onClick={() => setQarzdorModalVisible(true)}
          style={{ marginRight: 10 }}
        >
          Qarzdorlar
        </Button>
        <Button
          // type="primary"
          onClick={() => setXarajatlarModalVisible(true)}
          style={{ marginRight: 10 }}
        >
          Xarajatlar
        </Button>
        <Button
          // type="primary"
          onClick={() => setVazvratModalVisible(true)}
          style={{ marginRight: 10 }}
        >
          Vazvrat tavarlar
        </Button>
        <Button
          // type="primary"
          onClick={() => setSotuvModalVisible(true)}
          style={{ marginRight: 10 }}
        >
          Sotuv Tarixi
        </Button>
      </div>

      <Card
        title="."
        bordered={false}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "column-reverse",
          alignItems: "stretch",
          backgroundColor: "#1a2a6b",
          width: "80%",
          height: "100%",
          color: "white",
          borderRadius: 0.1,
          overflow: "auto",
        }}
        id="kassa"
      >
        <Input
          placeholder="shtrix kodi, mahsulot nomi yoki modeli bo'yicha qidirish..."
          value={searchTerm}
          onChange={handleSearchInput}
          onKeyPress={handleSearchKeyPress}
          style={{ marginBottom: 20, width: "40%" }}
          size="large"
        />

        <Table
          dataSource={filteredProducts}
          loading={isLoading}
          style={{ width: "100%" }}
          columns={[
            {
              title: "Mahsulot nomi",
              dataIndex: "product_name",
              key: "product_name",
            },
            { title: "Modeli", dataIndex: "model", key: "model" },
            {
              title: "Tan narxi",
              dataIndex: "purchase_price",
              key: "purchase_price",
              render: (text, record) =>
                `${text.toFixed(2)} ${record.sell_currency === "usd" ? "$" : "so'm"
                }`,
            },
            {
              title: "Narxi",
              dataIndex: "sell_price",
              key: "sell_price",
              render: (text, record) =>
                `${text.toFixed(2)} ${record.sell_currency === "usd" ? "$" : "so'm"
                }`,
            },
            {
              title: "Dokon Miqdori",
              dataIndex: "quantity",
              key: "quantity",
              render: (_, record) => {
                const storeQuantity = storeProducts
                  ? storeProducts.find(
                    (product) => product.product_id?._id === record._id
                  )?.quantity || 0
                  : 0;
                return Number(storeQuantity).toFixed(1);
              },
            },
            { title: "Shtrix kod", dataIndex: "barcode", key: "barcode" },
            {
              title: "Kimdan-kelgan",
              dataIndex: "kimdan_kelgan",
              key: "kimdan_kelgan",
            },
            {
              title: "Harakatlar",
              key: "actions",
              render: (_, record) => (
                <Button
                  type="primary"
                  onClick={() => handleSelectProduct(record, false)}
                >
                  Tanlash
                </Button>
              ),
            },
          ]}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />

        {selectedProducts.length > 0 && (
          <form onSubmit={handleFormSubmit}>
            <div style={{ marginTop: 20 }}>
              <h2>Tanlangan mahsulotlar:</h2>
              <Table
                dataSource={selectedProducts}
                style={{ width: "100%" }}
                columns={[
                  {
                    title: "Mahsulot nomi",
                    dataIndex: "product_name",
                    key: "product_name",
                  },
                  { title: "Model", dataIndex: "model", key: "model" },
                  {
                    title: "Tan narxi",
                    dataIndex: "purchase_price",
                    key: "purchase_price",
                  },
                  {
                    title: "Narxi",
                    render: (_, record) => (
                      <AntdInput
                        value={record.sell_price}
                        onChange={(e) =>
                          handleSellPriceChange(record._id, e.target.value)
                        }
                        type="number"
                        step="0.01"
                      />
                    ),
                  },
                  { title: "Miqdori", dataIndex: "quantity", key: "quantity" },
                  { title: "Shtrix kod", dataIndex: "barcode", key: "barcode" },
                  {
                    title: "Dokondagi miqdor",
                    dataIndex: "quantity",
                    key: "quantity",
                    render: (_, record) => {
                      const storeQuantity = storeProducts
                        ? storeProducts.find(
                          (product) => product.product_id?._id === record._id
                        )?.quantity || 0
                        : 0;
                      return Number(storeQuantity).toFixed(1);
                    },
                  },
                  {
                    title: "Soni",
                    key: "quantity",
                    render: (_, record) =>
                      record.count_type === "kg" ? (
                        <AntdInput
                          value={record.quantity}
                          onChange={(e) =>
                            handleQuantityChange(record._id, e.target.value)
                          }
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="kg (e.g., 1.5)"
                          style={{ width: "100px" }}
                        />
                      ) : (
                        <div>
                          <Button
                            onClick={() => handleQuantityChange(record._id, -1)}
                            disabled={record.quantity <= 1}
                          >
                            -
                          </Button>
                          <span style={{ margin: "0 10px" }}>
                            {record.quantity}
                          </span>
                          <Button
                            onClick={() => handleQuantityChange(record._id, 1)}
                          >
                            +
                          </Button>
                        </div>
                      ),
                  },
                  {
                    title: "Harakatlar",
                    key: "actions",
                    render: (_, record) => (
                      <Button
                        type="primary"
                        danger
                        onClick={() => handleRemoveProduct(record._id)}
                      >
                        O'chirish
                      </Button>
                    ),
                  },
                ]}
                rowKey="_id"
                pagination={false}
              />

              <div style={{ marginTop: 20, fontSize: "1.5em" }}>
                <strong>Umumiy summa: </strong>
                {totalAmount.toFixed(2)} so'm
              </div>
              <Button
                type="primary"
                htmlType="submit"
                style={{ marginTop: 20 }}
              >
                Sotish
              </Button>
            </div>
          </form>
        )}

        <Modal
          title="To'lov usulini tanlang"
          open={isModalVisible}
          onOk={handleSellProducts}
          onCancel={handleCancel}
          okText="Tasdiqlash"
          cancelText="Bekor qilish"
        >
          <Form layout="vertical">
            <Form.Item label="To'lov usuli">
              <Select
                value={paymentMethod}
                onChange={(value) => setPaymentMethod(value)}
                style={{ width: "100%" }}
              >
                <Option value="naqd">Naqd</Option>
                <Option value="plastik">Karta</Option>
                <Option value="qarz">Qarz</Option>
              </Select>
            </Form.Item>
            {paymentMethod === "qarz" && (
              <>
                <Form.Item label="Qarz oluvchi ismi">
                  <AutoComplete
                    options={debtorOptions}
                    value={debtorName}
                    onSelect={handleDebtorSelect}
                    onChange={(value) => setDebtorName(value)}
                    placeholder="Qarz oluvchi ismi"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Qarz oluvchi telefon raqami">
                  <AutoComplete
                    options={debtorOptions}
                    value={debtorPhone}
                    onSelect={handleDebtorSelect}
                    onChange={(value) => setDebtorPhone(value)}
                    placeholder="Qarz oluvchi telefon raqami"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Qarz muddatini kiriting">
                  <DatePicker
                    value={debtDueDate}
                    onChange={(date) => setDebtDueDate(date)}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>
      </Card>
    </div>
  );
}