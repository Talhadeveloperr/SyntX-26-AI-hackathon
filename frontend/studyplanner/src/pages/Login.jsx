// src/pages/Login.jsx

import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";

import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

import { login } from "../api/authApi";
import { AuthContext } from "../context/AuthContext";

import "bootstrap/dist/css/bootstrap.min.css";

const Login = () => {

  const navigate = useNavigate();

  const { loginUser } = useContext(AuthContext);

  // =========================
  // STATES
  // =========================
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState({});

  // =========================
  // HANDLE INPUT CHANGE
  // =========================
  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field validation
    setValidationErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    // Clear general error
    if (error) {
      setError("");
    }
  };

  // =========================
  // VALIDATE FORM
  // =========================
  const validateForm = () => {

    const errors = {};

    // Email
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    // Password
    if (!formData.password.trim()) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // =========================
  // HANDLE LOGIN
  // =========================
  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");

    // Validate
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {

      // =========================
      // API CALL
      // =========================
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      console.log("✅ LOGIN RESPONSE:", response.data);

      // =========================
      // STORE USER
      // =========================
      loginUser(response.data);

      // =========================
      // REDIRECT
      // =========================
      navigate("/dashboard");

    } catch (err) {

      console.error("❌ LOGIN ERROR:", err);

      // Backend response errors
      if (err.response) {

        const status = err.response.status;

        const errorMessage =
          err.response.data?.error ||
          err.response.data?.message;

        if (status === 401) {
          setError("Invalid email or password");
        }
        else if (status === 404) {
          setError("User not found");
        }
        else if (errorMessage) {
          setError(errorMessage);
        }
        else {
          setError("Login failed");
        }
      }

      // No server response
      else if (err.request) {
        setError(
          "Unable to connect to server"
        );
      }

      // Unknown error
      else {
        setError(
          "An unexpected error occurred"
        );
      }

    } finally {

      setLoading(false);
    }
  };

  // =========================
  // DEMO LOGIN
  // =========================
  const fillDemoCredentials = () => {

    setFormData({
      email: "a@gmail.com",
      password: "123456",
    });
  };

  return (

    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        padding: "40px 0",
      }}
    >

      <Container>

        <Row className="justify-content-center">

          <Col lg={6} md={8}>

            {/* =========================
                HEADER
            ========================= */}

            <div className="text-center mb-4">

              <div className="d-flex justify-content-center mb-3">

                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "50%",
                    padding: "15px",
                  }}
                >
                  <GraduationCap size={48} className="text-primary" />
                </div>

              </div>

              <h1
                className="text-white fw-bold"
              >
                Welcome Back
              </h1>

              <p className="text-white-50">
                Sign in to continue learning
              </p>

            </div>

            {/* =========================
                LOGIN CARD
            ========================= */}

            <Card className="shadow-lg border-0">

              <Card.Body className="p-5">

                {/* ERROR ALERT */}
                {error && (

                  <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError("")}
                  >
                    <Alert.Heading className="h6">
                      Login Failed
                    </Alert.Heading>

                    <p className="mb-0">
                      {error}
                    </p>

                  </Alert>
                )}

                {/* =========================
                    FORM
                ========================= */}

                <Form onSubmit={handleSubmit}>

                  {/* EMAIL */}

                  <Form.Group className="mb-4">

                    <Form.Label className="fw-bold">
                      Email
                    </Form.Label>

                    <InputGroup>

                      <InputGroup.Text>
                        <Mail size={18} />
                      </InputGroup.Text>

                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.email}
                      />

                      <Form.Control.Feedback type="invalid">
                        {validationErrors.email}
                      </Form.Control.Feedback>

                    </InputGroup>

                  </Form.Group>

                  {/* PASSWORD */}

                  <Form.Group className="mb-4">

                    <Form.Label className="fw-bold">
                      Password
                    </Form.Label>

                    <InputGroup>

                      <InputGroup.Text>
                        <Lock size={18} />
                      </InputGroup.Text>

                      <Form.Control
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.password}
                      />

                      <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </Button>

                      <Form.Control.Feedback type="invalid">
                        {validationErrors.password}
                      </Form.Control.Feedback>

                    </InputGroup>

                  </Form.Group>

                  {/* REMEMBER */}

                  <div className="d-flex justify-content-between mb-4">

                    <Form.Check
                      type="checkbox"
                      label="Remember me"
                    />

                    <Link
                      to="/forgot-password"
                      className="text-decoration-none"
                    >
                      Forgot Password?
                    </Link>

                  </div>

                  {/* LOGIN BUTTON */}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-100 mb-3"
                    disabled={loading}
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                    }}
                  >

                    {loading ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={18} className="ms-2" style={{ display: "inline-block", verticalAlign: "middle" }} />
                      </>
                    )}

                  </Button>

                  {/* DEMO */}

                  <Button
                    variant="outline-secondary"
                    className="w-100 mb-3"
                    type="button"
                    onClick={fillDemoCredentials}
                  >
                    Use Demo Credentials
                  </Button>

                  {/* REGISTER */}

                  <div className="text-center">

                    <p className="mb-0">

                      Don't have an account?{" "}

                      <Link
                        to="/register"
                        className="fw-bold text-decoration-none"
                      >
                        Register
                      </Link>

                    </p>

                  </div>

                </Form>

              </Card.Body>

            </Card>

          </Col>

        </Row>

      </Container>

    </div>
  );
};

export default Login;