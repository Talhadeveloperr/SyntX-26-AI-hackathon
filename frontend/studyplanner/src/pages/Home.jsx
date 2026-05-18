//frontend\studyplanner\src\pages\Home.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Navbar, 
  Nav, 
  Button, 
  Row, 
  Col, 
  Card, 
  Badge,
  Modal,
  Form,
  Alert,
  Spinner
} from 'react-bootstrap';
import { 
  BookOpen, 
  Brain, 
  Zap, 
  BarChart3, 
  FileText, 
  GraduationCap,
  LogOut,
  User,
  TrendingUp,
  Sparkles,
  Clock,
  Target
} from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    quizzesCompleted: 0,
    flashcardsMastered: 0,
    averageScore: 0,
    studyStreak: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Fetch user stats when component mounts
    fetchUserStats();
    fetchRecentActivity();
  }, []);

  const fetchUserStats = async () => {
    // Simulate fetching stats - replace with actual API calls
    setStats({
      quizzesCompleted: 12,
      flashcardsMastered: 48,
      averageScore: 85,
      studyStreak: 7
    });
  };

  const fetchRecentActivity = async () => {
    // Simulate recent activity - replace with actual API calls
    setRecentActivity([
      { id: 1, type: 'quiz', title: 'JavaScript Basics Quiz', score: 90, date: '2 hours ago' },
      { id: 2, type: 'flashcard', title: 'React Hooks', progress: 15, date: 'Yesterday' },
      { id: 3, type: 'study', title: 'Machine Learning Notes', pages: 25, date: '2 days ago' }
    ]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('student_id', user?.student_id);

    try {
      // API call to upload study material
      // const response = await axios.post('/api/upload', formData);
      console.log('File uploaded successfully');
      setShowUploadModal(false);
      setSelectedFile(null);
      // Show success message
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      // API call to generate quiz
      // const response = await axios.post('/api/generate-quiz', { 
      //   topic, 
      //   student_id: user?.student_id 
      // });
      console.log('Quiz generated for topic:', topic);
      setShowQuizModal(false);
      setTopic('');
      // Navigate to quiz page with generated quiz ID
      // navigate(`/quiz/${response.data.quiz_id}`);
    } catch (error) {
      console.error('Quiz generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Brain size={40} className="text-primary" />,
      title: "AI-Powered Explanations",
      description: "Get deep, personalized explanations from multiple AI models including GPT-4 and Groq",
      color: "primary"
    },
    {
      icon: <Zap size={40} className="text-warning" />,
      title: "Smart Quiz Generator",
      description: "Generate adaptive quizzes based on your study materials and weak areas",
      color: "warning"
    },
    {
      icon: <BookOpen size={40} className="text-success" />,
      title: "Intelligent Flashcards",
      description: "AI-generated flashcards with spaced repetition for better retention",
      color: "success"
    },
    {
      icon: <Target size={40} className="text-danger" />,
      title: "Weak Area Detection",
      description: "Advanced analytics to identify and improve your knowledge gaps",
      color: "danger"
    }
  ];

  const quickActions = [
    { 
      title: "Upload Study Material", 
      icon: <FileText />, 
      onClick: () => setShowUploadModal(true),
      variant: "outline-primary"
    },
    { 
      title: "Generate Quiz", 
      icon: <Sparkles />, 
      onClick: () => setShowQuizModal(true),
      variant: "outline-success"
    },
    { 
      title: "Create Flashcards", 
      icon: <BookOpen />, 
      onClick: () => console.log("Create flashcards"),
      variant: "outline-warning"
    },
    { 
      title: "View Progress", 
      icon: <TrendingUp />, 
      onClick: () => console.log("View progress"),
      variant: "outline-info"
    }
  ];

  return (
    <>
      {/* Navigation Bar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="/" className="d-flex align-items-center gap-2">
            <GraduationCap size={28} className="text-warning" />
            <strong>AI Study OS</strong>
            <Badge bg="info" className="ms-2">Beta</Badge>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center gap-3">
              <Nav.Link href="#features">Features</Nav.Link>
              <Nav.Link href="#dashboard">Dashboard</Nav.Link>
              {user ? (
                <div className="d-flex align-items-center gap-3">
                  <div className="text-light">
                    <User size={16} className="me-1" />
                    <span className="small">{user?.full_name || user?.email}</span>
                  </div>
                  <Button 
                    variant="outline-light" 
                    size="sm"
                    onClick={logout}
                    className="d-flex align-items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    variant="outline-light" 
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="warning" 
                    onClick={() => navigate('/register')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-5 mb-5" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-3">
                Your Personal AI Study Partner
              </h1>
              <p className="lead mb-4">
                Transform how you learn with intelligent AI that adapts to your needs.
                Generate quizzes, create flashcards, and track your progress in real-time.
              </p>
              {!user && (
                <div className="d-flex gap-3">
                  <Button size="lg" variant="warning" onClick={() => navigate('/register')}>
                    Start Learning Free
                  </Button>
                  <Button size="lg" variant="outline-light" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                </div>
              )}
            </Col>
            <Col lg={6}>
              <div className="text-center">
                <GraduationCap size={200} className="text-white-50" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Container>
        {/* Quick Stats Section (for logged-in users) */}
        {user && (
          <Row className="mb-5">
            <Col md={3} className="mb-3">
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <Target size={32} className="text-primary mb-2" />
                  <h3 className="mb-0">{stats.quizzesCompleted}</h3>
                  <small className="text-muted">Quizzes Completed</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <BookOpen size={32} className="text-success mb-2" />
                  <h3 className="mb-0">{stats.flashcardsMastered}</h3>
                  <small className="text-muted">Flashcards Mastered</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <TrendingUp size={32} className="text-warning mb-2" />
                  <h3 className="mb-0">{stats.averageScore}%</h3>
                  <small className="text-muted">Average Score</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="text-center h-100 shadow-sm">
                <Card.Body>
                  <Clock size={32} className="text-info mb-2" />
                  <h3 className="mb-0">{stats.studyStreak}</h3>
                  <small className="text-muted">Day Streak</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Quick Actions */}
        {user && (
          <div className="mb-5">
            <h3 className="mb-3">Quick Actions</h3>
            <Row>
              {quickActions.map((action, idx) => (
                <Col md={3} key={idx}>
                  <Button 
                    variant={action.variant}
                    className="w-100 d-flex align-items-center justify-content-center gap-2 py-3 mb-2"
                    onClick={action.onClick}
                  >
                    {action.icon}
                    {action.title}
                  </Button>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Features Section */}
        <section id="features" className="mb-5">
          <h2 className="text-center mb-5">Powerful Features for Better Learning</h2>
          <Row>
            {features.map((feature, idx) => (
              <Col md={6} lg={3} key={idx} className="mb-4">
                <Card className="h-100 shadow-sm text-center">
                  <Card.Body>
                    <div className="mb-3">{feature.icon}</div>
                    <h5>{feature.title}</h5>
                    <p className="text-muted">{feature.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Recent Activity Section */}
        {user && (
          <section id="dashboard" className="mb-5">
            <h3 className="mb-3">Recent Activity</h3>
            <Row>
              <Col lg={8}>
                {recentActivity.map(activity => (
                  <Card key={activity.id} className="mb-3 shadow-sm">
                    <Card.Body className="d-flex justify-content-between align-items-center">
                      <div>
                        <Badge bg={activity.type === 'quiz' ? 'success' : activity.type === 'flashcard' ? 'info' : 'secondary'} className="mb-2">
                          {activity.type.toUpperCase()}
                        </Badge>
                        <h6 className="mb-1">{activity.title}</h6>
                        <small className="text-muted">{activity.date}</small>
                      </div>
                      {activity.score && (
                        <Badge bg="primary" pill className="fs-6">
                          Score: {activity.score}%
                        </Badge>
                      )}
                      {activity.progress && (
                        <Badge bg="info" pill>
                          {activity.progress}/20 Cards
                        </Badge>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </Col>
              <Col lg={4}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-primary text-white">
                    <h6 className="mb-0">Study Tips</h6>
                  </Card.Header>
                  <Card.Body>
                    <p className="small">
                      💡 Based on your performance, focus on practicing more JavaScript concepts.
                    </p>
                    <p className="small">
                      🎯 You're doing great with React! Keep up the momentum.
                    </p>
                    <p className="small">
                      📚 Try the new quiz feature to test your knowledge.
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </section>
        )}

        {/* Call to Action */}
        {!user && (
          <div className="text-center bg-light p-5 rounded-3 mb-5">
            <h3>Ready to transform your learning?</h3>
            <p className="lead">Join thousands of students using AI Study OS</p>
            <Button variant="warning" size="lg" onClick={() => navigate('/register')}>
              Get Started Now
            </Button>
          </div>
        )}
      </Container>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Study Material</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFileUpload}>
          <Modal.Body>
            <Alert variant="info">
              Supported formats: PDF, TXT, DOCX (Max 10MB)
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Select File</Form.Label>
              <Form.Control 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept=".pdf,.txt,.docx"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Upload'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Quiz Generator Modal */}
      <Modal show={showQuizModal} onHide={() => setShowQuizModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Generate AI Quiz</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleGenerateQuiz}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Topic or Subject</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g., JavaScript Promises, React Hooks, Machine Learning"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Our AI will generate relevant questions based on this topic
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowQuizModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Generate Quiz'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default Home;