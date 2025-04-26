import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  DatePicker,
  Select,
  Statistic,
  Row,
  Col,
  Button,
} from "antd";
import { useGetSalesHistoryQuery } from "../../context/service/sale.service";
import { useGetExpensesQuery } from "../../context/service/harajatlar.service"; // Harajatlar uchun
import { useGetUsdRateQuery } from "../../context/service/usd.service"; // USD kursi uchun

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function SotuvTarix() {
  const { data: sales, isLoading } = useGetSalesHistoryQuery();
  const { data: harajatData } = useGetExpensesQuery(); // Harajatlar ma'lumotini olish
  const { data: usdRate } = useGetUsdRateQuery(); // USD kursini olish

  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [paymentMethod, setPaymentMethod] = useState("");

  const currentRate = usdRate?.rate || 13000; // Joriy kurs

  // Sana intervali o'zgarganda chaqiriladigan funksiya
  const onDateChange = (dates) => {
    setSelectedDateRange(dates);
    filterSales(dates, paymentMethod);
  };

  // To'lov usuli tanlanganda chaqiriladigan funksiya
  const onPaymentMethodChange = (value) => {
    setPaymentMethod(value);
    filterSales(selectedDateRange, value);
  };

  // Filtrlash funksiyasi
  const filterSales = (dates, payment) => {
    let filtered = sales || [];
    if (dates && dates[0] && dates[1]) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= dates[0] && saleDate <= dates[1];
      });
    }
    if (payment) {
      filtered = filtered.filter((sale) => sale.payment_method === payment);
    }
    setFilteredSales(filtered);
  };

  // Umumiy summani hisoblash funksiyasi (UZS)
  const totalAmount =
    filteredSales?.reduce((acc, sale) => acc + sale.total_price, 0) || 0;

  // Haftalik summani hisoblash funksiyasi (UZS)
  const weeklyAmount =
    filteredSales
      ?.filter(
        (sale) =>
          new Date(sale.createdAt) >=
          new Date(new Date().setDate(new Date().getDate() - 7))
      )
      .reduce((acc, sale) => acc + sale.total_price, 0) || 0;

  // Kunlik summani hisoblash funksiyasi (UZS)
  const dailyAmount =
    filteredSales
      ?.filter(
        (sale) =>
          new Date(sale.createdAt).toLocaleDateString() ===
          new Date().toLocaleDateString()
      )
      .reduce((acc, sale) => acc + sale.total_price, 0) || 0;

  // Umumiy xarid narxini hisoblash (UZS)
  const totalCost =
    filteredSales?.reduce((acc, sale) => {
      const buyPrice = sale?.buy_price || 0;
      const quantity = sale?.quantity || 0;
      const purchaseCurrency = sale?.product_id?.purchase_currency || "uzs";
      const saleUsdRate = sale?.usd_rate || currentRate;

      const convertedBuyPrice =
        purchaseCurrency === "usd" ? buyPrice * saleUsdRate : buyPrice;
      const cost = convertedBuyPrice * quantity;
      return acc + cost;
    }, 0) || 0;

  // Haftalik xarid narxini hisoblash (UZS)
  const weeklyCost =
    filteredSales
      ?.filter(
        (sale) =>
          new Date(sale.createdAt) >=
          new Date(new Date().setDate(new Date().getDate() - 7))
      )
      .reduce((acc, sale) => {
        const buyPrice = sale?.buy_price || 0;
        const quantity = sale?.quantity || 0;
        const purchaseCurrency = sale?.product_id?.purchase_currency || "uzs";
        const saleUsdRate = sale?.usd_rate || currentRate;

        const convertedBuyPrice =
          purchaseCurrency === "usd" ? buyPrice * saleUsdRate : buyPrice;
        const cost = convertedBuyPrice * quantity;
        return acc + cost;
      }, 0) || 0;

  // Kunlik xarid narxini hisoblash (UZS)
  const dailyCost =
    filteredSales
      ?.filter(
        (sale) =>
          new Date(sale.createdAt).toLocaleDateString() ===
          new Date().toLocaleDateString()
      )
      .reduce((acc, sale) => {
        const buyPrice = sale?.buy_price || 0;
        const quantity = sale?.quantity || 0;
        const purchaseCurrency = sale?.product_id?.purchase_currency || "uzs";
        const saleUsdRate = sale?.usd_rate || currentRate;

        const convertedBuyPrice =
          purchaseCurrency === "usd" ? buyPrice * saleUsdRate : buyPrice;
        const cost = convertedBuyPrice * quantity;
        return acc + cost;
      }, 0) || 0;

  // Harajatlarni hisoblash
  const totalExpenses =
    harajatData
      ?.filter(
        (item) =>
          (!selectedDateRange[0] ||
            new Date(item.created_at).getTime() >=
              selectedDateRange[0].startOf("day").toDate().getTime()) &&
          (!selectedDateRange[1] ||
            new Date(item.created_at).getTime() <=
              selectedDateRange[1].endOf("day").toDate().getTime())
      )
      .reduce((a, b) => a + (b?.payment_summ || 0), 0) || 0;

  const weeklyExpenses =
    harajatData
      ?.filter(
        (item) =>
          new Date(item.created_at) >=
          new Date(new Date().setDate(new Date().getDate() - 7))
      )
      .reduce((a, b) => a + (b?.payment_summ || 0), 0) || 0;

  const dailyExpenses =
    harajatData
      ?.filter(
        (item) =>
          new Date(item.created_at).toLocaleDateString() ===
          new Date().toLocaleDateString()
      )
      .reduce((a, b) => a + (b?.payment_summ || 0), 0) || 0;

  // Umumiy foydani hisoblash (totalAmount - totalCost - totalExpenses)
  const totalProfit = totalAmount - totalCost - totalExpenses;

  // Haftalik foydani hisoblash (weeklyAmount - weeklyCost - weeklyExpenses)
  const weeklyProfit = weeklyAmount - weeklyCost - weeklyExpenses;

  // Kunlik foydani hisoblash (dailyAmount - dailyCost - dailyExpenses)
  const dailyProfit = dailyAmount - dailyCost - dailyExpenses;

  // Dastlabki ma'lumotlarni to'ldirish uchun useEffect
  useEffect(() => {
    setFilteredSales(sales || []);
  }, [sales]);

  // Narxni number formatga o'zgartirish funksiyasi
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  // Bir kunlik savdo tarixini ko'rsatish funksiyasi
  const showDailySales = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    filterSales([startOfDay, endOfDay], paymentMethod);
  };

  return (
    <Card
      title="Sotuvlar tarixi"
      bordered={false}
      style={{ margin: 20, width: "100%" }}
    >
      <div style={{ marginBottom: 20 }}>
        <RangePicker onChange={onDateChange} style={{ marginRight: 20 }} />
        <Select
          placeholder="To'lov usulini tanlang"
          onChange={onPaymentMethodChange}
          style={{ width: 200, marginRight: 20 }}
        >
          <Option value="">Barchasi</Option>
          <Option value="naqd">Naqd</Option>
          <Option value="plastik">Karta</Option>
        </Select>
        <Button type="primary" onClick={showDailySales}>
          Bir kunlik savdo
        </Button>
      </div>

      {/* UZS bo'yicha summalar */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy summa"
            value={`${formatNumber(totalAmount)} so'm`}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik summa"
            value={`${formatNumber(weeklyAmount)} so'm`}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik summa"
            value={`${formatNumber(dailyAmount)} so'm`}
          />
        </Col>
      </Row>

    
  
      {/* UZS bo'yicha foyda */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy foyda"
            value={`${formatNumber(totalProfit)} so'm`}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik foyda"
            value={`${formatNumber(weeklyProfit)} so'm`}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik foyda"
            value={`${formatNumber(dailyProfit)} so'm`}
          />
        </Col>
      </Row>

      <Table
        dataSource={filteredSales}
        loading={isLoading}
        style={{ width: "100%" }}
        columns={[
          {
            title: "Mahsulot nomi",
            dataIndex: "product_name",
            key: "product_name",
          },
          {
            title: "Model",
            dataIndex: ["product_id", "model"],
            key: "model",
            render: (text, record) => `${record.product_id?.model || "N/A"}`,
          },
          {
            title: "Narxi",
            dataIndex: "sell_price",
            key: "sell_price",
            render: (text) => `${formatNumber(text)} so'm`,
          },
          { title: "Soni", dataIndex: "quantity", key: "quantity" },
          {
            title: "Umumiy narxi",
            key: "total_price",
            render: (_, record) =>
              `${formatNumber(record.sell_price * record.quantity)} so'm`,
          },
          {
            title: "Xarid narxi",
            key: "cost",
            render: (_, record) => {
              const buyPrice = record?.buy_price || 0;
              const quantity = record?.quantity || 0;
              const purchaseCurrency =
                record?.product_id?.purchase_currency || "uzs";
              const saleUsdRate = record?.usd_rate || currentRate;

              const convertedBuyPrice =
                purchaseCurrency === "usd" ? buyPrice * saleUsdRate : buyPrice;
              const cost = convertedBuyPrice * quantity;
              return `${formatNumber(cost)} so'm`;
            },
          },
          {
            title: "Foyda",
            key: "profit",
            render: (_, record) => {
              const sellPrice = record?.sell_price || 0;
              const buyPrice = record?.buy_price || 0;
              const quantity = record?.quantity || 0;
              const purchaseCurrency =
                record?.product_id?.purchase_currency || "uzs";
              const saleUsdRate = record?.usd_rate || currentRate;

              const convertedBuyPrice =
                purchaseCurrency === "usd" ? buyPrice * saleUsdRate : buyPrice;
              const profit = (sellPrice - convertedBuyPrice) * quantity;
              return `${formatNumber(profit)} so'm`;
            },
          },
          {
            title: "To'lov usuli",
            dataIndex: "payment_method",
            key: "payment_method",
          },
          {
            title: "Sotilgan sana",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => new Date(text).toLocaleString(),
          },
        ]}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell colSpan={5} align="right"></Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Card>
  );
}
