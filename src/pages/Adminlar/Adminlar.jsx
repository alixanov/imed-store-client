import React, { useState } from "react";
import { Button, Modal, Form, Input, message, Checkbox, Table } from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  useSignUpAsAdminMutation,
  useGetAdminsQuery,
  useDeleteAdminMutation,
  useUpdateAdminMutation,
} from "../../context/service/adminlar.service";

const { confirm } = Modal;

export default function Adminlar() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [signUpAsAdmin] = useSignUpAsAdminMutation();
  const { data: admins, isLoading, error, refetch } = useGetAdminsQuery();
  const [deleteAdmin] = useDeleteAdminMutation();
  const [updateAdmin] = useUpdateAdminMutation();
  const [form] = Form.useForm();

  console.log(admins);
  console.log(error);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleEditCancel = () => {
    setIsEditModalVisible(false);
    setEditingAdmin(null);
    form.resetFields();
  };

  const handleFinish = async (values) => {
    const { name, login, password, success = [] } = values; // Default to empty array if success is undefined
    const permissions = {
      xisobot: success.includes("xisobot"),
      qarzdorlar: success.includes("qarzdorlar"),
      xarajatlar: success.includes("xarajatlar"),
      skaladorlar: success.includes("skaladorlar"),
      vazvratlar: success.includes("vazvratlar"),
      adminlar: success.includes("adminlar"),
      sotuv_tarixi: success.includes("sotuv_tarixi"),
      dokon: success.includes("dokon"),
    };

    const payload = {
      name,
      login,
      password,
      success: permissions,
    };

    console.log(payload);

    try {
      const response = await signUpAsAdmin(payload).unwrap();
      console.log("Admin qo'shildi:", response);
      message.success("Admin muvaffaqiyatli qo'shildi!");
      setIsModalVisible(false);
      form.resetFields();
      refetch();
    } catch (err) {
      console.error("Xatolik:", err);
      message.error("Adminni qo'shishda xatolik yuz berdi.");
    }
  };

  const handleEditFinish = async (values) => {
    const { name, login, password, success = [] } = values; // Default to empty array if success is undefined
    const permissions = {
      xisobot: success.includes("xisobot"),
      qarzdorlar: success.includes("qarzdorlar"),
      xarajatlar: success.includes("xarajatlar"),
      skaladorlar: success.includes("skaladorlar"),
      vazvratlar: success.includes("vazvratlar"),
      adminlar: success.includes("adminlar"),
      sotuv_tarixi: success.includes("sotuv_tarixi"),
      dokon: success.includes("dokon"),
      SalesStatistics: success.includes("SalesStatistics"),
    };

    const payload = {
      id: editingAdmin._id,
      name,
      login,
      password,
      success: permissions,
    };

    console.log(payload);

    try {
      const response = await updateAdmin(payload).unwrap();
      console.log("Admin yangilandi:", response);
      message.success("Admin muvaffaqiyatli yangilandi!");
      setIsEditModalVisible(false);
      setEditingAdmin(null);
      form.resetFields();
      refetch();
    } catch (err) {
      console.error("Xatolik:", err);
      message.error("Adminni yangilashda xatolik yuz berdi.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteAdmin(id).unwrap();
      console.log("Admin o'chirildi:", response);
      message.success("Admin muvaffaqiyatli o'chirildi!");
      refetch();
    } catch (error) {
      console.error("Xatolik:", error);
      message.error("Adminni o'chirishda xatolik yuz berdi.");
    }
  };

  const showDeleteConfirm = (id) => {
    confirm({
      title: "Bu adminni o'chirishni istaysizmi?",
      icon: <ExclamationCircleOutlined />,
      content: "Bu harakatni qaytarishning imkoni yo'q!",
      okText: "Ha",
      okType: "danger",
      cancelText: "Yo'q",
      onOk() {
        handleDelete(id);
      },
      onCancel() {
        console.log("Bekor qilindi");
      },
    });
  };

  const columns = [
    {
      title: "Ism",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Login",
      dataIndex: "login",
      key: "login",
    },
    {
      title: "adminlar",
      dataIndex: ["success", "adminlar"],
      key: "adminlar",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Xisobot",
      dataIndex: ["success", "xisobot"],
      key: "xisobot",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Qarzdorlar",
      dataIndex: ["success", "qarzdorlar"],
      key: "qarzdorlar",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Xarajatlar",
      dataIndex: ["success", "xarajatlar"],
      key: "xarajatlar",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Skaladorlar",
      dataIndex: ["success", "skaladorlar"],
      key: "skaladorlar",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Vazvratlar",
      dataIndex: ["success", "vazvratlar"],
      key: "vazvratlar",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Sotuv tarixi",
      dataIndex: ["success", "sotuv_tarixi"],
      key: "sotuv_tarixi",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "dokon",
      dataIndex: ["success", "dokon"],
      key: "dokon",
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "statistika",
      dataIndex: ["success", "SalesStatistics"],
      render: (text) => (text ? "Ha" : "Yo'q"),
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Button
            type="primary"
            onClick={() => {
              setEditingAdmin(record);
              setIsEditModalVisible(true);
              form.setFieldsValue({
                name: record.name,
                login: record.login,
                password: record.password,
                success: Object.keys(record.success).filter(
                  (key) => record.success[key]
                ),
              });
            }}
          >
            <EditOutlined /> Tahrirlash
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => showDeleteConfirm(record._id)}
          >
            O'chirish
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        icon={<UserAddOutlined />}
        onClick={showModal}
        style={{ marginBottom: "10px" }}
      >
        Admin qo'shish
      </Button>

      <Modal
        title="Admin Qo'shish"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        style={{ marginTop: "50px" }}
      >
        <Form
          layout="vertical"
          onFinish={handleFinish}
          form={form}
          initialValues={{ success: [] }} // Set default value for success
        >
          <Form.Item
            label="Ism"
            name="name"
            rules={[{ required: true, message: "Ismni kiriting!" }]}
          >
            <Input placeholder="Ism" />
          </Form.Item>

          <Form.Item
            label="Login"
            name="login"
            rules={[{ required: true, message: "Loginni kiriting!" }]}
          >
            <Input placeholder="Login" />
          </Form.Item>

          <Form.Item
            label="Parol"
            name="password"
            rules={[{ required: true, message: "Parolni kiriting!" }]}
          >
            <Input.Password placeholder="Parol" />
          </Form.Item>

          <Form.Item label="Ruxsatlar" name="success">
            <Checkbox.Group>
              <Checkbox value="xisobot">Xisobot</Checkbox>
              <Checkbox value="qarzdorlar">Qarzdorlar</Checkbox>
              <Checkbox value="xarajatlar">Xarajatlar</Checkbox>
              <Checkbox value="skaladorlar">Skaladorlar</Checkbox>
              <Checkbox value="vazvratlar">Vazvratlar</Checkbox>
              <Checkbox value="adminlar">Adminlar</Checkbox>
              <Checkbox value="sotuv_tarixi">Sotuv tarixi</Checkbox>
              <Checkbox value="dokon">Dokon</Checkbox>
              <Checkbox value="SalesStatistics">statistika</Checkbox>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Adminni Tahrirlash"
        open={isEditModalVisible}
        onCancel={handleEditCancel}
        footer={null}
        style={{ marginTop: "50px" }}
      >
        <Form
          layout="vertical"
          onFinish={handleEditFinish}
          form={form}
          initialValues={{ success: [] }} // Set default value for success
        >
          <Form.Item
            label="Ism"
            name="name"
            rules={[{ required: true, message: "Ismni kiriting!" }]}
          >
            <Input placeholder="Ism" />
          </Form.Item>

          <Form.Item
            label="Login"
            name="login"
            rules={[{ required: true, message: "Loginni kiriting!" }]}
          >
            <Input placeholder="Login" />
          </Form.Item>

          <Form.Item
            label="Parol"
            name="password"
            rules={[{ required: true, message: "Parolni kiriting!" }]}
          >
            <Input.Password placeholder="Parol" />
          </Form.Item>

          <Form.Item label="Ruxsatlar" name="success">
            <Checkbox.Group>
              <Checkbox value="xisobot">Xisobot</Checkbox>
              <Checkbox value="qarzdorlar">Qarzdorlar</Checkbox>
              <Checkbox value="xarajatlar">Xarajatlar</Checkbox>
              <Checkbox value="skaladorlar">Skaladorlar</Checkbox>
              <Checkbox value="vazvratlar">Vazvratlar</Checkbox>
              <Checkbox value="adminlar">Adminlar</Checkbox>
              <Checkbox value="sotuv_tarixi">Sotuv tarixi</Checkbox>
              <Checkbox value="dokon">Dokon</Checkbox>
              <Checkbox value="SalesStatistics">statistika</Checkbox>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Table
        dataSource={admins}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}