import React, { useState, useRef, useEffect } from "react";
import {
  ChakraProvider,
  Box,
  Input,
  Text,
  Center,
  Spinner,
  extendTheme,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stack,
  Flex,
  SkeletonCircle,
  useToast,
} from "@chakra-ui/react";
import {
  FaUserAstronaut,
  FaUser,
  FaUpload,
  FaArrowAltCircleRight,
} from "react-icons/fa";
import Typewriter from "./Typewriter";

const customTheme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "#ffffff",
      },
    },
  },
});

function App() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [answer, setAnswer] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [responseStatus, setResponseStatus] = useState(null);

  const scrollableBoxRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState("580px");
  const toast = useToast();
  const toast2 = useToast();
  const toast3 = useToast();
  const toast4 = useToast();

  const accentColor = "#ffffff";
  const popColor = "#006266";

  useEffect(() => {
    const updateMaxHeight = () => {
      if (scrollableBoxRef.current) {
        const windowHeight = window.innerHeight;
        const newMaxHeight = windowHeight - 130;
        setMaxHeight(`${newMaxHeight}px`);
      }
    };

    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);

    return () => {
      window.removeEventListener("resize", updateMaxHeight);
    };
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    const allowedExtensions = [".pdf", ".doc", ".docx"];
    let isValid = true;

    files.forEach((file) => {
      const fileExtension = file.name
        .toLowerCase()
        .slice(file.name.lastIndexOf("."));
      if (!allowedExtensions.includes(fileExtension)) {
        // Invalid file selected, show a toast notification and set isValid to false
        toast({
          title: "Invalid File",
          description: "Please select a PDF, DOC, or DOCX file.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        isValid = false;
      }
    });

    if (isValid) {
      // All selected files are valid, add them to the selectedFiles array
      setSelectedFiles([...selectedFiles, ...files]);
    }
  };
  const handleFileDelete = (index) => {
    // Remove the selected file at the specified index
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      // Handle the case when selectedFiles is empty
      toast2({
        title: "Upload a file",
        description: "Please upload files before chatting",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setQuestion("");
    setChatHistory([...chatHistory, { question, answer: "" }]);
    setIsLoading(true);

    // Send question to the backend
    const response = await fetch("http://0.0.0.0:8000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: question }),
    });

    if (response.ok) {
      const data = await response.json();
      setAnswer(data.answer);
      setChatHistory([...chatHistory, { question, answer: data.answer }]);
      setQuestion("");
    }

    // Reset isLoading to false when the response is received
    setIsLoading(false);
  };

  const handleKey = async () => {
    try {
      const response = await fetch("http://0.0.0.0:8000/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to send API key.");
      }

      const data = await response.json();
      setResponseStatus(data.status);
      console.log(data.status);

      if (data.status === "pass") {
        toast4({
          title: "API Key not accepted",
          status: "error",
          duration: 1500,
          isClosable: true,
        });
      } else if (data.status === "fail") {
        toast4({
          title: "API Key accepted!",
          status: "success",
          duration: 1500,
          isClosable: true,
        });
        setApiKey("");
      } else {
        toast4({
          title: "Unexpected response",
          status: "warning",
          duration: 1500,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFile = async () => {
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    try {
      const response = await fetch("http://0.0.0.0:8000/uploadfiles/", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        console.log("Files uploaded successfully");
      } else {
        console.error("Error uploading files");
      }
    } catch (error) {
      console.error("Error uploading files", error);
    }
  };

  const handleClearFolder = async () => {
    try {
      const response = await fetch("http://0.0.0.0:8000/clear-folder", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
      } else {
        console.error("Failed to clear folder.");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
    toast3({
      title: "Files and chat log cleared!",
      status: "success",
      duration: 1500,
      isClosable: true,
    });
  };

  const handleInputChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleKeyChange = (e) => {
    setApiKey(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleApiKeyDown = (e) => {
    if (e.key === "Enter") {
      handleKey(e);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    console.log(selectedFiles);
    handleFile();
  };

  const sendKey = () => {
    handleKey();
    setApiKey("");
  };

  const resetChat = () => {
    setChatHistory([]);
    setSelectedFiles([]);
    handleClearFolder();
  };

  useEffect(() => {
    scrollableBoxRef.current.scrollTop = scrollableBoxRef.current.scrollHeight;
  }, [chatHistory]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      setChatHistory([]);
      setSelectedFiles([]);
      handleClearFolder();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const iconStyle = {
    fontSize: "24px",
  };

  const buttonStyle = {
    fontSize: "40px",
  };

  return (
    <ChakraProvider theme={customTheme}>
      <Flex justify="space-between" p={4} bg={accentColor}>
        <Text as="h1" fontSize="2xl" color="black" ml="10px" fontWeight="bold">
          <b>dropdoc</b>
        </Text>
        <Flex>
          <Input
            ml="20px"
            type="text"
            placeholder="Enter OpenAI API key"
            onChange={handleKeyChange}
            backgroundColor="#ffffff"
            onKeyDown={handleApiKeyDown}
            width={{ base: "60%", md: "60%", lg: "60%" }}
            mr="7px"
            borderWidth={2}
          />
          <Button
            backgroundColor={popColor}
            onClick={sendKey}
            textColor="white"
            mr="30px"
          >
            send
          </Button>
          <Button
            backgroundColor={popColor}
            onClick={openModal}
            textColor="white"
            mr="10px"
          >
            upload &nbsp;<FaUpload style={buttonStyle}></FaUpload>
          </Button>
          <Button
            backgroundColor={popColor}
            onClick={resetChat}
            mr="5px"
            textColor="white"
          >
            reset
          </Button>
        </Flex>
      </Flex>
      <Center>
        {chatHistory.length > 0 ? (
          <Box
            ref={scrollableBoxRef}
            id="scrollable-box"
            borderWidth="0px"
            borderRadius="lg"
            borderColor="#ffffff"
            p={4}
            width={{ base: "85%", md: "85%", lg: "85%" }}
            overflowY="auto"
            maxHeight={maxHeight}
            backgroundColor="#ffffff"
          >
            {chatHistory.map((item, index) => (
              <div key={index} className="chat-item">
                <Box
                  backgroundColor="#E4E4E4"
                  p={2}
                  mb={2}
                  mr="5px"
                  borderRadius="md"
                  display="flex"
                >
                  <FaUser style={iconStyle} color="black"></FaUser>
                  <Text fontWeight="bold" color="black" ml="22px">
                    {item.question}
                  </Text>
                </Box>
                <Box
                  backgroundColor="#ffffff"
                  p={2}
                  borderRadius="md"
                  display="flex"
                >
                  <Box>
                    <FaUserAstronaut style={iconStyle}></FaUserAstronaut>
                  </Box>
                  <Box ml="22px">
                    <Typewriter text={item.answer} delay={5} />
                    {index === chatHistory.length - 1 && isLoading && (
                      <>
                        <Flex>
                          <SkeletonCircle
                            startColor="black"
                            endColor="white"
                            size="3"
                            mr="10px"
                            mt="3px"
                          ></SkeletonCircle>
                          <SkeletonCircle
                            startColor="white"
                            endColor="black"
                            size="3"
                            mt="3px"
                          ></SkeletonCircle>
                        </Flex>
                      </>
                    )}
                  </Box>
                </Box>
                <br></br>
              </div>
            ))}
          </Box>
        ) : (
          <Box
            ref={scrollableBoxRef}
            id="scrollable-box"
            borderWidth="0px"
            borderRadius="lg"
            borderColor="#ffffff"
            p={4}
            width={{ base: "85%", md: "85%", lg: "85%" }}
            overflowY="auto"
            maxH="400px"
            mb="30px"
            backgroundColor="#ffffff"
          >
            {chatHistory.map((item, index) => (
              <div key={index} className="chat-item">
                <Box
                  backgroundColor={accentColor}
                  p={2}
                  mb={2}
                  mr="5px"
                  borderRadius="md"
                  display="flex"
                >
                  <Text fontWeight="bold" color="black" ml="22px">
                    {item.question}
                  </Text>
                </Box>
                <Box
                  backgroundColor="#ffffff"
                  p={2}
                  borderRadius="md"
                  display="flex"
                >
                  <Typewriter text={item.answer} delay={100} />
                </Box>
                <br></br>
              </div>
            ))}
            <Center>
              <Text fontWeight="bold" size="lg" mt="100px">
                Enter an OpenAI API key and upload files to start chatting!
              </Text>
            </Center>
          </Box>
        )}
      </Center>
      <Box
        position="fixed"
        bottom="0%"
        left="0"
        width="100%"
        padding="20px"
        backgroundColor={accentColor}
        borderColor="#000000"
      >
        <form onSubmit={handleSubmit} className="chat-input">
          <Center>
            <Box display="flex" width={{ base: "90%", md: "90%", lg: "90%" }}>
              {" "}
              {/* Add a flex container */}
              <Input
                type="text"
                placeholder="Ask a question..."
                value={question}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                backgroundColor="#ffffff"
                textColor="black"
                border={true}
                borderWidth={2}
              />
              <Button
                type="submit"
                textColor="white"
                backgroundColor={popColor}
                ml={2}
                onClick={handleSubmit}
                fontWeight="bold"
              >
                {isLoading ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <FaArrowAltCircleRight />
                )}
              </Button>
            </Box>
          </Center>
        </form>
      </Box>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent backgroundColor={accentColor}>
          <ModalHeader color="black">Upload</ModalHeader>
          <ModalCloseButton color="black" />
          <ModalBody>
            <Box mb="10px">
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf, .doc, .docx"
                mb="10px"
                variant="outline"
                placeholder="Select a file"
                border="10px"
                displayText="test"
                textColor="#E4E4E4"
                backgroundColor="#E4E4E4"
                sx={{
                  "::file-selector-button": {
                    height: 10,
                    padding: 0,
                    mr: 4,
                    background: "#E4E4E4",
                    border: "none",
                  },
                }}
              />
            </Box>
            <Stack ml="10px" spacing={2}>
              {selectedFiles.map((file, index) => (
                <Box key={index} display="flex" alignItems="center">
                  <Text fontWeight="bold" color="black">
                    {file.name}
                  </Text>
                  <Button
                    size="xs"
                    ml="5px"
                    colorScheme="red"
                    onClick={() => handleFileDelete(index)}
                  >
                    X
                  </Button>
                </Box>
              ))}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              backgroundColor={popColor}
              onClick={closeModal}
              textColor="white"
            >
              upload files
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  );
}

export default App;
