import React, { useState } from "react";
import { Table, Button, Input, message, Modal, Popconfirm } from "antd";
import { EyeOutlined } from "@ant-design/icons"; // Иконка глаза
import {
  useGetDebtorsQuery,
  usePayDebtMutation,
  useReturnProductDebtorMutation,
  useUpdateDebtorMutation,
  useUpdatePriceMutation,
} from "../../context/service/debtor.service"; // Debtor service import qilish
import moment from "moment/moment";
import { useGetAllProductsQuery } from "../../context/service/addproduct.service";

export default function Qarzdor() {
  const { data: debtors, isLoading, refetch } = useGetDebtorsQuery(); // Barcha qarzdorlarni olish
  const [updatePrice] = useUpdatePriceMutation();
  const [payDebt] = usePayDebtMutation();
  const [updateDebtor] = useUpdateDebtorMutation(); // Qarzdorni yangilash uchun hook
  const [returnDebtor] = useReturnProductDebtorMutation(); // Qarzdorni yangilash uchun hook
  const [paymentAmounts, setPaymentAmounts] = useState({}); // Har bir qarzdor uchun kiritilgan summa
  const [listModal, setListModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null); // Выбранный должник для модального окна
  const [returnQuantity, setReturnQuantity] = useState({}); // Har bir qarzdor uchun qaytarilayotgan soni
  const { data: products = [] } = useGetAllProductsQuery();
  const [debtLog, setDebtLog] = useState([])

  // To'lov summasini o'zgartirish funksiyasi
  const handleInputChange = (id, value) => {
    setPaymentAmounts((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Qarz to'lash funksiyasi
  const handlePayDebt = async (debtor) => {
    const paidAmount = paymentAmounts[debtor._id]; // To'langan summani olish
    const trimmedAmount = Number(paidAmount?.trim());

    if (!trimmedAmount || isNaN(trimmedAmount) || trimmedAmount <= 0) {
      message.error("Iltimos, to'langan summani to'g'ri kiriting");
      return;
    }

    if (trimmedAmount > debtor.debt_amount) {
      message.error(
        `To'langan summa qarz miqdoridan (${debtor.debt_amount}) oshmasligi kerak`
      );
      return;
    }

    try {
      await updateDebtor({
        id: debtor._id,
        paid_amount: trimmedAmount, // Son formatida yuborish
      }).unwrap();

      message.success("Qarz muvaffaqiyatli to'landi");
      setPaymentAmounts((prev) => ({ ...prev, [debtor._id]: "" })); // Inputni tozalash
      refetch(); // Qarzlar ro'yxatini yangilash
    } catch (error) {
      message.error(error?.data?.message || "Qarz to'lashda xatolik yuz berdi");
    }
  };

  // Tovarni qaytarish funksiyasi
  const handleReturnProduct = async (debtor) => {
    const quantity = returnQuantity[debtor._id]; // Qaytarilayotgan soni olish
    const trimmedQuantity = Number(quantity?.trim());

    if (!trimmedQuantity || isNaN(trimmedQuantity) || trimmedQuantity <= 0) {
      message.error("Iltimos, qaytarilayotgan sonini to'g'ri kiriting");
      return;
    }

    if (trimmedQuantity > debtor.product_quantity) {
      message.error(
        `Qaytarilayotgan soni mahsulot sonidan (${debtor.product_quantity}) oshmasligi kerak`
      );
      return;
    }

    try {
      await returnDebtor({
        id: debtor._id,
        quantity: trimmedQuantity, // Son formatida yuborish
      }).unwrap();

      message.success("Mahsulot muvaffaqiyatli qaytarildi");
      setReturnQuantity((prev) => ({ ...prev, [debtor._id]: "" })); // Inputni tozalash
      refetch(); // Qarzlar ro'yxatini yangilash
    } catch (error) {
      message.error(
        error?.data?.message || "Mahsulotni qaytarishda xatolik yuz berdi"
      );
    }
  };

  // Удаление дубликатов клиентов
  const uniqueDebtors = debtors?.reduce((acc, debtor) => {
    if (!acc.find((d) => d.phone === debtor.phone)) {
      acc.push(debtor);
    }
    return acc;
  }, []);

  // Форматирование количества товаров
  const formatProductQuantity = (debtor) => {
    const productsByDebtor = debtors?.filter((d) => d.phone === debtor.phone);
    const productList = productsByDebtor?.map((d) => `${d.product_name}:${d.product_quantity}`).join("\n");
    const totalQuantity = productsByDebtor?.reduce((sum, d) => sum + d.product_quantity, 0);
    return `${totalQuantity}`;
  };
  const formatProductSum = (debtor) => {
    const productsByDebtor = debtors?.filter((d) => d.phone === debtor.phone);
    const productList = productsByDebtor?.map((d) => `${d.product_name}:${d.product_quantity}`).join("\n");
    const totalQuantity = productsByDebtor?.reduce((sum, d) => sum + d.debt_amount, 0);
    return `${totalQuantity}`;
  };

  // Table ustunlari
  const columns = [
    { title: "Ism", dataIndex: "name", key: "name", width: 100 },
    { title: "Telefon", dataIndex: "phone", key: "phone", width: 100 },
    {
      title: "Soni",
      key: "product_quantity",
      width: 100,
      render: (_, record) => (
        <div style={{ whiteSpace: "pre-line" }}>
          {formatProductQuantity(record)}
        </div>
      ),
    },

    {
      title: "Qarz miqdori",
      render: (_, record) => (
        <div style={{ whiteSpace: "pre-line" }}>
          {formatProductSum(record)}
        </div>),
      key: "debt_amount",
      width: 100,
    },
    {
      title: "Harakatlar",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedDebtor(record); // Устанавливаем выбранного должника
              setListModal(true); // Открываем модальное окно
            }}
          />


          {/* <Input
            placeholder="To'langan summa"
            value={paymentAmounts[record._id] || ""}
            onChange={(e) => handleInputChange(record._id, e.target.value)}
            type="number"
            min="0"
            style={{ width: 100 }}
          />
          <Button type="primary" onClick={() => handlePayDebt(record)}>
            To'lash
          </Button>

          <Input
            placeholder="Qaytarilayotgan soni"
            value={returnQuantity[record._id] || ""}
            onChange={(e) =>
              setReturnQuantity((prev) => ({
                ...prev,
                [record._id]: e.target.value,
              }))
            }
            type="number"
            min="0"
            max={record.product_quantity}
            style={{ width: 100 }}
          />
          <Button type="primary" danger onClick={() => handleReturnProduct(record)}>
            Qaytarish
          </Button> */
          
          }

        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Модальное окно для отображения всех данных */}
      <Modal
        open={listModal}
        title={`${selectedDebtor?.name}ning barcha xaridlari`}
        footer={null}
        onCancel={() => {
          setListModal(false);
          setSelectedDebtor(null);
        }}
        width={1000}
      >
        {selectedDebtor && (
          <Table
            dataSource={debtors?.filter((d) => d.phone === selectedDebtor.phone)}
            columns={[
              { title: "Mahsulot", dataIndex: "product_name", key: "product_name" },
              { title: "Soni", dataIndex: "product_quantity", key: "product_quantity" },
              {
                title: "Sotish narxi",
                render: (_, record) => (
                  <input
                    onBlur={(e) => { // 📌 Foydalanuvchi inputdan chiqsa, narxni yangilaydi
                      updatePrice({ id: record._id, sell_price: Number(e.target.value) });
                    }}
                    onKeyPress={(e) => { // 📌 Foydalanuvchi "Enter" bossa, narxni yangilaydi
                      if (e.key === "Enter") {
                        updatePrice({ id: record._id, sell_price: Number(e.target.value) });
                      }
                    }}
                    style={{ border: "1px solid #ccc", height: "30px", borderRadius: "4px", paddingInline: "4px" }}
                    type="number"
                    defaultValue={record.sell_price}
                  />

                )
              },
              { title: "Qarz miqdori", render: (_, record) => (record.sell_price * record.product_quantity), key: "debt_amount" },
              {
                title: "Qarz muddati",
                dataIndex: "due_date",
                key: "due_date",
                render: (text) => moment(text).format("YYYY-MM-DD"),
              },
              {
                title: "To'lash",
                render: (_, record) => (
                  <Popconfirm onCancel={() => { }} onConfirm={() => payDebt({ id: record._id })} title="To'lash tasdiqlash ?"
                    cancelText={"Yoq"}
                    okText={"Xa"}
                  >
                    <Button type="primary">
                      To'lash
                    </Button>
                  </Popconfirm>


                  
                  
                )
              },

              {
                title: "Vozvrat",
                render: (_, record) => (
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <Input
                      placeholder="Qaytarilayotgan soni"
                      value={returnQuantity[record._id] || ""}
                      onChange={(e) =>
                        setReturnQuantity((prev) => ({
                          ...prev,
                          [record._id]: e.target.value,
                        }))
                      }
                      type="number"
                      min="0"
                      max={record.product_quantity}
                      style={{ width: 100 }}
                    />
                    <Button type="primary" danger onClick={() => handleReturnProduct(record)}>
                      Qaytarish
                    </Button>
                  </div>
                ),
              }




            ]}
            pagination={false}
          />
        )}
      </Modal>

      {/* Основная таблица */}
      <Table
        dataSource={uniqueDebtors} // Используем уникальных должников
        loading={isLoading}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        size="small"
        style={{ fontSize: "12px" }}
      />
    </div>
  );
}