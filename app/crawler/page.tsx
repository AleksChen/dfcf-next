'use client';

import React, { useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Card,
  message,
  Alert,
  Typography,
  Select,
} from "antd";
import { BugOutlined, RocketOutlined } from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";

const { Title, Paragraph } = Typography;

export default function CrawlerView() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockCode: values.stockCode,
          platform: values.platform,
          pageStart: values.pageStart,
          pageEnd: values.pageEnd,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Crawl failed");
      }

      setResult(data);
      message.success("爬虫任务执行成功！");
    } catch (error: any) {
      console.error(error);
      message.error(`执行失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
        <Card>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Title level={2}>
              <BugOutlined /> 爬虫控制台
            </Title>
            <Paragraph type="secondary">
              配置参数触发后端爬虫任务，抓取数据将保存至数据库。
            </Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              stockCode: "002085",
              platform: "eastmoney",
              pageStart: 1,
              pageEnd: 1,
            }}
          >
            <Form.Item
              label="股票代码"
              name="stockCode"
              rules={[{ required: true, message: "请输入股票代码" }]}
            >
              <Input placeholder="例如: 002085" size="large" />
            </Form.Item>

            <Form.Item
              label="爬虫平台"
              name="platform"
              rules={[{ required: true, message: "请选择爬虫平台" }]}
            >
              <Select size="large" placeholder="选择爬虫平台">
                <Select.Option value="eastmoney">东方财富</Select.Option>
                <Select.Option value="xueqiu">雪球</Select.Option>
              </Select>
            </Form.Item>

            <div style={{ display: "flex", gap: "16px" }}>
              <Form.Item
                label="起始页码"
                name="pageStart"
                rules={[{ required: true, message: "请输入起始页码" }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={1} style={{ width: "100%" }} size="large" />
              </Form.Item>

              <Form.Item
                label="结束页码"
                name="pageEnd"
                rules={[{ required: true, message: "请输入结束页码" }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={1} style={{ width: "100%" }} size="large" />
              </Form.Item>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                icon={<RocketOutlined />}
              >
                {loading ? "正在爬取..." : "开始爬取"}
              </Button>
            </Form.Item>
          </Form>

          {result && (
            <Alert
              message="执行结果"
              description={
                <pre
                  style={{
                    maxHeight: "300px",
                    overflow: "auto",
                    marginTop: "10px",
                  }}
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              }
              type="success"
              showIcon
              style={{ marginTop: "24px" }}
            />
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
