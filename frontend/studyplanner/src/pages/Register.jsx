import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner,
  InputGroup
} from 'react-bootstrap';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, Calendar, Building2, MapPin } from 'lucide-react';
import { register } from '../api/authApi';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    class_level: '',
    institution_name: '',
    city: '',
    age: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    } else if (formData.full_name.length < 3) {
      errors.full_name = 'Full name must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.age && (formData.age < 5 || formData.age > 120)) {
      errors.age = 'Please enter a valid age';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    const submitData = {
      full_name: formData.full_name,
      email: formData.email,
      password: formData.password,
      class_level: formData.class_level || null,
      institution_name: formData.institution_name || null,
      city: formData.city || null,
      age: formData.age ? parseInt(formData.age) : null
    };
    
    try {
      const response = await register(submitData);
      setSuccess('Registration successful! Redirecting to login...');
      
      setFormData({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        class_level: '',
        institution_name: '',
        city: '',
        age: ''
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response && err.response.data) {
        setError(err.response.data.error || err.response.data.message || 'Registration failed');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const classLevels = [
    'High School Freshman',
    'High School Sophomore', 
    'High School Junior',
    'High School Senior',
    'Undergraduate Year 1',
    'Undergraduate Year 2',
    'Undergraduate Year 3',
    'Undergraduate Year 4',
    'Graduate Student',
    'PhD Student',
    'Professional',
    'Other'
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 0'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} xl={7}>
            <div className="text-center mb-4">
              <div className="d-flex justify-content-center mb-3">
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  padding: '15px',
                  display: 'inline-block'
                }}>
                  <GraduationCap size={48} className="text-primary" />
                </div>
              </div>
              <h1 className="text-white mb-2">Join AI Study OS</h1>
              <p className="text-white-50">Start your journey to smarter learning</p>
            </div>

            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                {error && (
                  <Alert variant="danger" onClose={() => setError('')} dismissible>
                    <Alert.Heading>Registration Failed</Alert.Heading>
                    <p>{error}</p>
                  </Alert>
                )}
                
                {success && (
                  <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                    <Alert.Heading>Success!</Alert.Heading>
                    <p>{success}</p>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <User size={16} className="me-1" style={{ verticalAlign: "middle" }} />
                      Full Name *
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <User size={18} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="full_name"
                        placeholder="Enter your full name"
                        value={formData.full_name}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.full_name}
                      />
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.full_name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <Mail size={16} className="me-1" style={{ verticalAlign: "middle" }} />
                      Email Address *
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <Mail size={18} />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.email}
                      />
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <Lock size={16} className="me-1" style={{ verticalAlign: "middle" }} />
                      Password *
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <Lock size={18} />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create a password (min. 6 characters)"
                        value={formData.password}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.password}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </Button>
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.password}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Confirm Password *</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <Lock size={18} />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.confirmPassword}
                      />
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <hr className="my-4" />
                  <h6 className="mb-3 text-muted">Optional Information</h6>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <GraduationCap size={16} className="me-1" style={{ verticalAlign: "middle" }} />
                          Class Level
                        </Form.Label>
                        <Form.Select
                          name="class_level"
                          value={formData.class_level}
                          onChange={handleChange}
                        >
                          <option value="">Select your class level</option>
                          {classLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <Calendar size={16} className="me-1" style={{ verticalAlign: "middle" }} />
                          Age
                        </Form.Label>
                        <Form.Control
                          type="number"
                          name="age"
                          placeholder="Your age"
                          value={formData.age}
                          onChange={handleChange}
                          isInvalid={!!validationErrors.age}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.age}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      <Building2 size={16} className="me-1" style={{ verticalAlign: "middle" }} />
                      Institution Name
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <Building2 size={18} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="institution_name"
                        placeholder="e.g., Harvard University, MIT, etc."
                        value={formData.institution_name}
                        onChange={handleChange}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>
                      <MapPin size={16} className="me-1" style={{ verticalAlign: "middle" }} />
                      City
                    </Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <MapPin size={18} />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        name="city"
                        placeholder="Your city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg"
                    className="w-100 mb-3"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="mb-0">
                      Already have an account?{' '}
                      <Link to="/login" className="text-decoration-none fw-bold">
                        Sign In
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <div className="text-center text-white-50 mt-4">
              <small>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </small>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;