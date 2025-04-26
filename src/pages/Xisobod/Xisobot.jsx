import React, { useEffect, useState } from "react";
import { useGetSalesHistoryQuery } from "../../context/service/sale.service";
import { useGetAllProductsQuery } from "../../context/service/addproduct.service";
import { useGetDebtorsQuery } from "../../context/service/debtor.service";
import { useGetStoreProductsQuery } from "../../context/service/store.service";
import { useGetExpensesQuery } from "../../context/service/harajatlar.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { DatePicker } from "antd";
import "./xisobot.css";

const { RangePicker } = DatePicker;

export default function Xisobot() {
  const { data: saleData } = useGetSalesHistoryQuery();
  const { data: skladData } = useGetAllProductsQuery();
  const { data: storeData } = useGetStoreProductsQuery();
  const { data: debtData } = useGetDebtorsQuery();
  const { data: harajatData } = useGetExpensesQuery();
  const { data: usdRate } = useGetUsdRateQuery();

  const [selectedRange, setSelectedRange] = useState([]);
  const [umumiyDebt, setUmumiyDebt] = useState(0);
  const [umumiySale, setUmumiySale] = useState(0);
  const [umumiySklad, setUmumiySklad] = useState(0);
  const [umumiyStore, setUmumiyStore] = useState(0);
  const [umumiyHarajat, setUmumiyHarajat] = useState(0);
  const [umumiyAstatka, setUmumiyAstatka] = useState(0);
  const [umumiyAstatkaUzs, setUmumiyAstatkaUzs] = useState(0);
  const [umumiyFoyda, setUmumiyFoyda] = useState(0); // Yangi state foyda uchun

  const handleDateChange = (dates) => {
    setSelectedRange(dates || []);
  };

  useEffect(() => {
    const startDate =
      selectedRange?.[0]?.startOf("day")?.toDate().getTime() || null;
    const endDate =
      selectedRange?.[1]?.endOf("day")?.toDate().getTime() || null;
    const currentRate = usdRate?.rate || 13000; // Hozirgi kurs (faqat yangi hisoblar uchun)

    // Qarzdorlik hisoblash
    setUmumiyDebt(
      debtData
        ?.filter(
          (item) =>
            (!startDate || new Date(item.createdAt).getTime() >= startDate) &&
            (!endDate || new Date(item.createdAt).getTime() <= endDate)
        )
        .reduce((a, b) => a + (b?.debt_amount || 0), 0) || 0
    );

    // Sklad umumiy foyda (bu yerda hozirgi kurs ishlatiladi, chunki bu joriy holatni ko'rsatadi)
    setUmumiySklad(
      skladData?.reduce(
        (a, b) =>
          a +
          (b?.stock || 0) *
            ((b?.sell_price || 0) - (b?.purchase_price || 0)) *
            (b?.sell_currency === "usd" ? currentRate : 1),
        0
      ) || 0
    );

    // Do'kondagi mahsulotlar umumiy foydasi
    setUmumiyStore(
      storeData?.reduce(
        (a, b) =>
          a +
          (b?.quantity || 0) *
            ((b?.product_id?.sell_price || 0) -
              (b?.product_id?.purchase_price || 0)) *
            (b?.product_id?.sell_currency === "usd" ? currentRate : 1),
        0
      ) || 0
    );

    // Sotuvlardan umumiy foydani hisoblash
    const totalProfitFromSales =
      saleData
        ?.filter(
          (item) =>
            (!startDate || new Date(item.createdAt).getTime() >= startDate) &&
            (!endDate || new Date(item.createdAt).getTime() <= endDate)
        )
        .reduce((a, b) => {
          const sellPrice = b?.sell_price || 0; // Sotish narxi (so'mda)
          const buyPrice = b?.buy_price || 0; // Xarid narxi (USD yoki so'm)
          const quantity = b?.quantity || 0;
          const purchaseCurrency = b?.product_id?.purchase_currency || "uzs"; // Xarid valyutasi
          const saleUsdRate = b?.usd_rate || currentRate; // Sotuv vaqtidagi kursni olamiz, agar yo'q bo'lsa joriy kurs

          // Xarid narxini so'mga aylantiramiz (sotuv vaqtidagi kursdan foydalanamiz)
          const convertedBuyPrice =
            purchaseCurrency === "usd" ? buyPrice * saleUsdRate : buyPrice;

          // Foyda: (sotish narxi - xarid narxi) * miqdor
          const profit = (sellPrice - convertedBuyPrice) * quantity;
          return a + profit;
        }, 0) || 0;

    // Harajatlarni hisoblash
    const totalExpenses =
      harajatData
        ?.filter(
          (item) =>
            (!startDate || new Date(item.created_at).getTime() >= startDate) &&
            (!endDate || new Date(item.created_at).getTime() <= endDate)
        )
        .reduce((a, b) => a + (b?.payment_summ || 0), 0) || 0;

    // Umumiy foyda (sotuvlardan foyda - harajatlar)
    const calculatedProfit = totalProfitFromSales - totalExpenses;
    setUmumiyFoyda(calculatedProfit < 0 ? 0 : calculatedProfit);

    // Umumiy sotuv daromadi (foyda emas, umumiy sotuv summasi)
    const totalSalesAmount =
      saleData
        ?.filter(
          (item) =>
            (!startDate || new Date(item.createdAt).getTime() >= startDate) &&
            (!endDate || new Date(item.createdAt).getTime() <= endDate)
        )
        .reduce((a, b) => a + (b?.total_price || 0), 0) || 0;

    setUmumiySale(totalSalesAmount);
    setUmumiyHarajat(totalExpenses);

    // Sklad va do'kondagi astatka (USD)
    setUmumiyAstatka(
      (skladData
        ?.filter((sd) => sd.sell_currency === "usd")
        .reduce((a, b) => a + (b?.stock || 0) * (b?.purchase_price || 0), 0) ||
        0) +
        (storeData
          ?.filter((sd) => sd?.product_id?.sell_currency === "usd")
          .reduce(
            (a, b) =>
              a + (b?.quantity || 0) * (b?.product_id?.purchase_price || 0),
            0
          ) || 0)
    );

    // Sklad va do'kondagi astatka (UZS)
    setUmumiyAstatkaUzs(
      (skladData
        ?.filter((sd) => sd.sell_currency === "uzs")
        .reduce((a, b) => a + (b?.stock || 0) * (b?.purchase_price || 0), 0) ||
        0) +
        (storeData
          ?.filter((sd) => sd?.product_id?.sell_currency === "uzs")
          .reduce(
            (a, b) =>
              a + (b?.quantity || 0) * (b?.product_id?.purchase_price || 0),
            0
          ) || 0)
    );
  }, [
    debtData,
    saleData,
    skladData,
    storeData,
    harajatData,
    selectedRange,
    usdRate,
  ]);

  return (
    <div style={{ height: "calc(100vh - 200px)", paddingInline: "12px" }}>
      <div style={{ marginBottom: "20px" }}>
        <RangePicker
          onChange={handleDateChange}
          format="YYYY-MM-DD"
          style={{ width: "100%" }}
        />
      </div>

      <div className="hisobot_container">
        <div className="hisobot_card">
          <p>Umumiy sotuv summasi</p>
          <b>{umumiySale.toLocaleString()} UZS</b>
        </div>
        <div className="hisobot_card">
          <p>Umumiy foyda</p>
          <b>{umumiyFoyda.toLocaleString()} UZS</b>
        </div>
        <div className="hisobot_card">
          <p>Umumiy qarzdorlik</p>
          <b>{umumiyDebt.toLocaleString()} UZS</b>
        </div>
        <div className="hisobot_card">
          <p>Umumiy harajat</p>
          <b>{umumiyHarajat.toLocaleString()} UZS</b>
        </div>
        <div className="hisobot_card">
          <p>Sklad va Do'kon - umumiy astatka ($)</p>
          <b>{umumiyAstatka.toLocaleString()}$</b>
        </div>
        <div className="hisobot_card">
          <p>Sklad va Do'kon - umumiy astatka (so'm)</p>
          <b>{umumiyAstatkaUzs.toLocaleString()} so'm</b>
        </div>
      </div>
    </div>
  );
}
