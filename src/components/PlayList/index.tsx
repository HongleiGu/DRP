/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React from 'react';
import { Modal, Button, Form, Input, Row, Col, Image } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

export interface VideoElement {
  name: string;
  vid: string;
}

interface PlayListProps {
  chatroomId: string;
  visible: boolean;
  setVisible: (x: boolean) => void;
  videos: VideoElement[];
  addVideos: (video: VideoElement) => void;
  setVideos: (videos: VideoElement[]) => void;
  removeVideo: (index: number) => void;
}

export function PlayList({ 
  chatroomId, 
  visible, 
  setVisible, 
  videos, 
  addVideos,
  removeVideo,
  setVideos,
}: PlayListProps) {
  const [form] = Form.useForm();

  const hideModal = () => setVisible(false);

  const handleAdd = (value: VideoElement) => {
    // const { name, vid } = value;
    // setVideos([...videos, { name, vid }]);
    addVideos(value)
    form.resetFields();
  };

  const handleDelete = (index: number) => {
    // const newVideos = [...videos];
    // newVideos.splice(index, 1);
    removeVideo(index)
    // setVideos(newVideos);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 1000
    }}>
      {/* Floating action button */}
      <Button 
        type="primary" 
        shape="circle" 
        size="large"
        icon={<PlusOutlined />} 
        onClick={() => setVisible(true)}
        style={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: 56,
          height: 56
        }}
      />
      
      {/* Video manager modal */}
      <Modal
        title="YouTube Video Manager"
        open={visible}
        onCancel={hideModal}
        footer={[
          <Button key="close" onClick={hideModal}>
            Close
          </Button>
        ]}
        width={800}
        styles={
          {
            body: { maxHeight: '70vh', overflowY: 'auto' }
          }
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdd}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Video Name"
                name="name"
                rules={[{ required: true, message: 'Please enter a name' }]}
              >
                <Input placeholder="Enter display name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="YouTube Video ID"
                name="vid"
                rules={[
                  { required: true, message: 'Please enter video ID' },
                  { min: 11, message: 'ID must be at least 11 characters' }
                ]}
              >
                <Input placeholder="Enter YouTube video ID" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Video
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24 }}>
          <h3>Video Previews ({videos.length})</h3>
          {videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <p>No videos added yet</p>
              <p style={{ color: '#bfbfbf' }}>Add a video to see previews</p>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {videos.map((video, index) => (
                <Col key={index} xs={24} sm={12} md={8} lg={8}>
                  <div style={{ 
                    position: 'relative', 
                    border: '1px solid #f0f0f0', 
                    padding: 8, 
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>
                    <Button
                      icon={<DeleteOutlined />}
                      type="text"
                      danger
                      style={{ position: 'absolute', top: 4, right: 4, zIndex: 1 }}
                      onClick={() => handleDelete(index)}
                    />
                    <Image
                      src={`https://img.youtube.com/vi/${video.vid}/mqdefault.jpg`}
                      alt={video.name}
                      preview={false}
                      style={{ 
                        width: '100%', 
                        borderRadius: 4,
                        aspectRatio: '16/9',
                        objectFit: 'cover'
                      }}
                      fallback="https://via.placeholder.com/300x169?text=Thumbnail+Missing"
                    />
                    <div style={{ 
                      padding: '8px 4px', 
                      fontWeight: 500, 
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {video.name}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Modal>
    </div>
  );
};