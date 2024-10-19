import React, { useState, useCallback } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  Grid,
  extendTheme,
  Container,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Progress,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.800',
        color: 'gray.100',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        _hover: {
          boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.6)',
          transition: 'all 0.3s',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          bg: 'gray.700',
          color: 'gray.100',
          _placeholder: { color: 'gray.400' },
        },
      },
    },
  },
});

function App() {
  const [formData, setFormData] = useState({
    host_file: '',
    chg_number: '',
    ttl_duration: 7,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'text/plain') {
        setFormData(prevState => ({
          ...prevState,
          host_file: file.name
        }));
        toast({
          title: 'File uploaded',
          description: `${file.name} has been uploaded successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a text file.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'text/plain',
    multiple: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    try {
      const response = await axios.post('/api/create-snapshots', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      toast({
        title: 'Snapshots created',
        description: `Total VMs: ${response.data.total_vms}, Successful: ${response.data.successful_snapshots}, Failed: ${response.data.failed_snapshots}`,
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'An error occurred',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAzureLogin = async () => {
    try {
      const response = await axios.get('/api/azure-login');
      window.open(response.data.login_url, '_blank');
      toast({
        title: 'Azure Login',
        description: `Please use the code ${response.data.user_code} to log in to Azure.`,
        status: 'info',
        duration: null,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate Azure login',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  const bgColor = 'gray.700';
  const borderColor = 'gray.600';

  return (
    <ChakraProvider theme={theme}>
      <Box textAlign="center" fontSize="xl" bg="gray.800" minH="100vh" py={10}>
        <Container maxW="container.md">
          <Heading as="h1" size="2xl" mb={6} bgGradient="linear(to-r, teal.300, cyan.300, blue.300)" bgClip="text">
            Azure Self-Destruct Snapshot Creator
          </Heading>
          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="xl" borderWidth={1} borderColor={borderColor}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl>
                  <FormLabel color="gray.200">VM List File</FormLabel>
                  <Box
                    {...getRootProps()}
                    p={4}
                    borderWidth={2}
                    borderRadius="md"
                    borderColor={isDragActive ? 'blue.400' : 'gray.500'}
                    borderStyle="dashed"
                    cursor="pointer"
                    bg="gray.600"
                    color="gray.200"
                  >
                    <input {...getInputProps()} />
                    {formData.host_file ? (
                      <Text>{formData.host_file}</Text>
                    ) : (
                      <Text>{isDragActive ? 'Drop the file here' : 'Drag and drop a text file here, or click to select'}</Text>
                    )}
                  </Box>
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.200">CHG Number</FormLabel>
                  <Input
                    name="chg_number"
                    value={formData.chg_number}
                    onChange={handleInputChange}
                    placeholder="Enter CHG number"
                    required
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.200">Snapshot Time-to-Live (days)</FormLabel>
                  <Input
                    type="number"
                    name="ttl_duration"
                    value={formData.ttl_duration}
                    onChange={handleInputChange}
                    min={1}
                  />
                </FormControl>
                <Button
                  colorScheme="blue"
                  onClick={handleAzureLogin}
                  width="full"
                  size="lg"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                >
                  Azure Login
                </Button>
                <Button
                  colorScheme="teal"
                  isLoading={isLoading}
                  type="submit"
                  width="full"
                  size="lg"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                >
                  Create Snapshots
                </Button>
              </VStack>
            </form>
            {isLoading && (
              <Box mt={6}>
                <Text mb={2} color="gray.200">{`Progress: ${progress}%`}</Text>
                <Progress value={progress} size="sm" colorScheme="teal" hasStripe isAnimated />
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;