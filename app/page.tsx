'use client';

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  Input,
  message,
  Card,
  Row,
  Col,
  Typography,
  Button,
  Spin,
  Space,
  Tag
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  DeleteOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import MainLayout from "@/components/MainLayout";

const { Title, Text } = Typography;

interface Post {
  id: string;
  title: string;
  content?: string;
  author: {
    id: string;
    nickname: string;
  };
  stockCode: string;
  publishTime: string;
  clickCount: number;
  commentCount: number;
  source: string;
  createdAt: string;
}

export default function AnalysisView() {
  const [data, setData] = useState<Post[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<any>(null);

  // 获取统计信息和数据
  const fetchData = async () => {
    setLoading(true);
    try {
      // 获取统计信息
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      // 获取最新的帖子数据
      const postsRes = await fetch('/api/posts?limit=500');
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setData(postsData.data);
        message.success(`成功加载 ${postsData.count} 条数据`);
      }
    } catch (error) {
      console.error(error);
      message.error("加载数据失败");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 动态生成表格列
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      ellipsis: true,
    },
    {
      title: '作者',
      dataIndex: ['author', 'nickname'],
      key: 'author',
      width: 120,
    },
    {
      title: '股票代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '平台',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => (
        <Tag color={source === 'eastmoney' ? 'green' : 'orange'}>
          {source === 'eastmoney' ? '东方财富' : '雪球'}
        </Tag>
      ),
    },
    {
      title: '点击数',
      dataIndex: 'clickCount',
      key: 'clickCount',
      width: 100,
      sorter: (a: Post, b: Post) => a.clickCount - b.clickCount,
    },
    {
      title: '评论数',
      dataIndex: 'commentCount',
      key: 'commentCount',
      width: 100,
      sorter: (a: Post, b: Post) => a.commentCount - b.commentCount,
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
      sorter: (a: Post, b: Post) => 
        new Date(a.publishTime).getTime() - new Date(b.publishTime).getTime(),
    },
  ];

  // 搜索过滤
  const filteredData = useMemo(() => {
    if (!searchText) return data;
    const lowerSearch = searchText.toLowerCase();

    return data.filter((item) => {
      return (
        item.title.toLowerCase().includes(lowerSearch) ||
        item.author.nickname.toLowerCase().includes(lowerSearch) ||
        item.stockCode.toLowerCase().includes(lowerSearch)
      );
    });
  }, [data, searchText]);

  const clearData = () => {
    setData([]);
    setSearchText("");
    setStats(null);
  };

  return (
    <MainLayout>
      <div style={{ padding: "24px" }}>
        <Row gutter={[16, 16]}>
          {/* 统计信息区 */}
          {stats && (
            <Col span={24}>
              <Row gutter={16}>
                <Col span={8}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>
                        {stats.totalPosts}
                      </div>
                      <div style={{ marginTop: '8px', color: '#666' }}>总帖子数</div>
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                        {stats.byPlatform?.eastmoney || 0}
                      </div>
                      <div style={{ marginTop: '8px', color: '#666' }}>东方财富</div>
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                        {stats.byPlatform?.xueqiu || 0}
                      </div>
                      <div style={{ marginTop: '8px', color: '#666' }}>雪球</div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>
          )}

          {/* 控制面板区 */}
          <Col span={24}>
            <Card>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <Title level={4} style={{ margin: 0 }}>
                    <FileTextOutlined /> 数据分析
                  </Title>
                  {data.length > 0 && (
                    <Text type="secondary">共 {data.length} 条记录</Text>
                  )}
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <Input
                    placeholder="搜索标题、作者、股票代码..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 250 }}
                    allowClear
                  />
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={fetchData}
                  >
                    刷新
                  </Button>
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={clearData} 
                    disabled={!data.length}
                  >
                    清除
                  </Button>
                </div>
              </div>
            </Card>
          </Col>

          {/* 数据展示区 */}
          <Col span={24}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" tip="加载数据中..." />
              </div>
            ) : data.length > 0 ? (
              <Card
                title="数据透视"
                extra={<span>显示 {filteredData.length} 条结果</span>}
              >
                <Table
                  dataSource={filteredData}
                  columns={columns}
                  rowKey="id"
                  scroll={{ x: "max-content" }}
                  pagination={{
                    defaultPageSize: 20,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                  size="middle"
                  bordered
                />
              </Card>
            ) : (
              <EmptyState onRefresh={fetchData} />
            )}
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <Card style={{ textAlign: 'center', padding: '50px' }}>
    <div style={{ color: '#ccc', fontSize: '48px', marginBottom: '16px' }}>
      <FileTextOutlined />
    </div>
    <Title level={5} style={{ color: '#999', marginBottom: '16px' }}>
      暂无数据
    </Title>
    <Button type="primary" icon={<ReloadOutlined />} onClick={onRefresh}>
      加载数据
    </Button>
  </Card>
);
