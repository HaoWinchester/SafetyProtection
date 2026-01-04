/**
 * Login Page - Modern Design
 * Inspired by Vercel, GitHub, GitLab
 */
import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService, LoginData, RegisterData } from '../../services/auth';

import './Login.css';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Handle login
  const onLoginFinish = async (values: LoginData) => {
    setLoading(true);
    try {
      const user = await authService.login(values);
      message.success(`欢迎回来, ${user.username}!`);
      navigate(from, { replace: true });
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const onRegisterFinish = async (values: RegisterData) => {
    setLoading(true);
    try {
      const user = await authService.register(values);
      message.success(`注册成功! 欢迎, ${user.username}! 赠送10次免费配额`);
      navigate(from, { replace: true });
    } catch (error: any) {
      message.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Side - Branding */}
      <div className="login-branding">
        <div className="branding-content">
          <div className="logo-section">
            <div className="logo-icon">
              <SafetyOutlined />
            </div>
            <h1>幻谱安全</h1>
            <p className="tagline">AI Security Platform</p>
          </div>

          <div className="features">
            <div className="feature-item">
              <div className="feature-icon">
                <ThunderboltOutlined />
              </div>
              <div className="feature-text">
                <h3>实时检测</h3>
                <p>毫秒级响应,精准识别安全威胁</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <SafetyOutlined />
              </div>
              <div className="feature-text">
                <h3>多维防护</h3>
                <p>10种攻击类型分类,全方位保护</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <RocketOutlined />
              </div>
              <div className="feature-text">
                <h3>灵活计费</h3>
                <p>按量付费,套餐自由选择</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="login-form-section">
        <div className="form-container">
          <div className="form-header">
            <h2>{isLogin ? '欢迎回来' : '创建账户'}</h2>
            <p>{isLogin ? '登录您的账户以继续' : '开始您的安全检测之旅'}</p>
          </div>

          {isLogin ? (
            <Form
              name="login"
              onFinish={onLoginFinish}
              autoComplete="off"
              layout="vertical"
              requiredMark={false}
              className="auth-form"
            >
              <Form.Item
                label="用户名或邮箱"
                name="username"
                rules={[{ required: true, message: '请输入用户名或邮箱' }]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder="username@example.com"
                />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder="•••••••••"
                />
              </Form.Item>

              <div className="form-actions">
                <a href="#" className="forgot-password">忘记密码?</a>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  className="submit-button"
                >
                  登录
                </Button>
              </Form.Item>

              <div className="form-footer">
                <p>
                  还没有账户?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="link-button"
                  >
                    立即注册
                  </button>
                </p>
              </div>
            </Form>
          ) : (
            <Form
              name="register"
              onFinish={onRegisterFinish}
              autoComplete="off"
              layout="vertical"
              requiredMark={false}
              className="auth-form"
            >
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { max: 20, message: '用户名最多20个字符' }
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder="johndoe"
                />
              </Form.Item>

              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  size="large"
                  prefix={<MailOutlined />}
                  placeholder="username@example.com"
                />
              </Form.Item>

              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder="•••••••••"
                />
              </Form.Item>

              <Form.Item
                label="姓名(可选)"
                name="full_name"
              >
                <Input
                  size="large"
                  placeholder="John Doe"
                />
              </Form.Item>

              <div className="terms-agreement">
                <p>
                  注册即表示您同意我们的{' '}
                  <a href="#" className="link-button">服务条款</a>
                  {' '}和{' '}
                  <a href="#" className="link-button">隐私政策</a>
                </p>
              </div>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  block
                  className="submit-button"
                >
                  创建账户
                </Button>
              </Form.Item>

              <div className="form-footer">
                <p>
                  已有账户?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="link-button"
                  >
                    立即登录
                  </button>
                </p>
              </div>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
