'use client';

import React from 'react';
import { Layout, Menu } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { AreaChartOutlined, BugOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      key: '/',
      icon: <AreaChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/crawler',
      icon: <BugOutlined />,
      label: '爬虫任务',
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          background: "#001529",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "18px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginRight: "40px",
            minWidth: "200px"
          }}
        >
          <span>📊 DFCF 数据平台</span>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
          onClick={({ key }) => router.push(key)}
        />
      </Header>
      <Content style={{ background: "#f0f2f5" }}>
        {children}
      </Content>
      <Footer style={{ textAlign: "center" }}>
        DFCF Crawler Analysis System ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}
