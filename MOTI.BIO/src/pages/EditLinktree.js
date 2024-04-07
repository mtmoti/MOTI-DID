import React, { useState, useEffect } from "react";
import { Web3Storage } from "web3.storage";
import {
  Box,
  Button,
  Flex,
  Text,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import uuid from "react-uuid";
import { getLinktreeWithUsername, updateLinktree } from "../api";
import { useNavigate, useLocation } from "react-router-dom";
import { useWalletContext } from "../contexts";
import { Oval } from "react-loader-spinner";
import { logoutUser } from "../redux/slice/userSlice";
import MasterMagic from "../components/modals/magic/MasterMagic";
import { X, Copy } from "lucide-react";
import { LogOut } from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  themeApplier,
  createThemeApplier,
  getRadioButtonScheme,
} from "../helpers";
import {magic} from "../components/modals/magic/MasterMagic";
import LinktreeEditForm from "../components/form/edit-form";
import { handleCopy } from "../helpers/copyText";
import { useLogoutModalContext } from "../contexts/logoutModalContext";
import LogoutModal from "../components/LogoutModal";
import { useSelector } from "react-redux";
import ReactGA from "react-ga";
import { Link } from "react-router-dom";
import {useDispatch} from "react-redux"
function trackPageView(location) {
  ReactGA.set({ page: location.pathname });
  ReactGA.pageview(location.pathname);
}

document.documentElement.setAttribute("data-theme", "dark");

function makeStorageClient() {
  return new Web3Storage({
    token: process.env.REACT_APP_WEB3STORAGE_TOKEN,
  });
}

const EditLinktree = () => {
  const dispatch = useDispatch()
  const { publicKey, nodeList, userData, setMagicPayload, magicPayload } =
    useWalletContext();
  const [files, setFiles] = useState([]);
  const [imageName, setImageName] = useState(null);
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isFetchingUserData, setIsFetchingUserData] = useState(false);
  const [user, setUser] = useState(null);
  const [choosenTheme, setChoosenTheme] = useState("Dark");
  const [radioColorScheme, setRadioColorScheme] = useState("yellow");
  const [imageChanged, setImageChanged] = useState(false);
  const currentUser = useSelector((state) => state.user?.user);
  const {
    isOpen: isLogoutModalOpen,
    onOpen: openLogoutModal,
    onClose: closeLogoutModal,
  } = useLogoutModalContext();

  const [choosenLabelTheme, setChoosenLabelTheme] = useState(
    user?.linktree?.choosenLabelTheme || "label-one"
  );

  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    document.title = "Edit Your Profile | MOTI.BIO";
  });
  const { onOpen, onClose, isOpen } = useDisclosure();
  useEffect(() => {
    trackPageView(location);
  }, [location]);
  const query = location.pathname.split("/")[2];
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
      setImageName(acceptedFiles[0].name);
    },
  });

  const handleLabelSelection = (e) => {
    setChoosenLabelTheme(e);
  };

  useEffect(() => {
    document.title = "Edit Your Profile | MOTI.BIO";
    if (nodeList.length === 0) return;
    if (!currentUser?.publicKey) {
      toast({
        title: "You are not logged in!",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      navigate("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        setIsFetchingUserData(true);
        // console.log(query, "query")
        // console.log(nodeList, "nodeList")
        const userResponse = await getLinktreeWithUsername(query, nodeList);
        setUser(userResponse.data.data);

        if (!userResponse.data.data) {
          console.log("User not found");
          toast({
            title: "User Not Found!",
            description: "User not found, you'll be redirected to login page.",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
          navigate("/login");
        }

        if (userResponse?.data?.publicKey !== currentUser?.publicKey) {
          toast({
            title: "Not Authorized!",
            description:
              "You are not authorized to edit this profile, you'll be redirected to login page",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top",
          });
          magic.user.logout();
          dispatch(logoutUser());
          navigate("/login", { replace: true });
        }

        setIsFetchingUserData(false);
      } catch (error) {
        console.log("Error", error);
        setIsFetchingUserData(false);
      }
    };

    // setTimeout(() => {
    fetchUserData();
    // }, 2000)
  }, [nodeList.length, query, currentUser?.publicKey]);

  useEffect(() => {
    // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, [files]);
  useEffect(()=>{
    magic.user.isLoggedIn().then(e=>{
      if (!e){
        dispatch(logoutUser());
        navigate("/login")
      }
    })
  })

  useEffect(() => {
    themeApplier(user?.linktree?.theme);
    setChoosenTheme(user?.linktree?.theme);
    handleThemeSelection(user?.linktree?.theme);
  }, [user?.linktree?.theme]);

  function handleThemeSelection(theme) {
    setChoosenTheme(theme);
    createThemeApplier(theme);
    const colorScheme = getRadioButtonScheme(theme);
    setRadioColorScheme(colorScheme);
  }

  async function uploadToIPFS(image) {
    const formData = new FormData();
    formData.append("file", image);
    const url = "https://koii.pexelsoft.com/";

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Blob uploaded successfully", responseData);
        return responseData.protocolLink;
      } else {
        const errorResponse = await response.text();
        console.error("Upload failed", response.status, errorResponse);
        throw new Error(`Upload failed: ${response.status} ${errorResponse}`);
      }
    } catch (error) {
      console.error("Error occurred during upload", error);
      throw error; // rethrow the error if you want to handle it outside of this function
    }
  }

  const insertKey = (links) => {
    return links.map((item, index) => {
      return {
        ...item,
        isFavorite: index === 0 ? true : false,
        key: uuid(),
      };
    });
  };

  useEffect(() => {
    setMagicPayload(null);
  }, []);

  const handleSubmitMagic = async (values, actions) => {
    try {
      setIsLoading(true);
      let imageCID;
      if (image && imageChanged) {
        if (image?.size > 1024 * 1024 * 4) {
          setIsLoading(false);
          return toast({
            title: "Try again",
            description:
              "Your image is too powerful! Please reupload a file below 4MB.",
            status: "error",
            duration: 4000,
            isClosable: true,
            position: "top",
          });
        }
        console.log("image true");
        imageCID = await uploadToIPFS(image);
        if (imageCID === null) {
          setIsLoading(false);
          return toast({
            title: "Try again",
            description: "Error uploading image",
            status: "error",
            duration: 2000,
            isClosable: true,
            position: "top",
          });
        }
      }

      values.links = insertKey(values.links);
      // values.description = values.description.replace(/\n/g, "<br />");
      console.log(values);

      const payload = {
        uuid: user?.uuid,
        linktree: {
          ...values,
          image: image ? imageCID + "/avatar.jpeg" : user?.linktree?.image,
          background: "",
          theme: choosenTheme,
          choosenLabelTheme: choosenLabelTheme,
        },
        timestamp: Date.now(),
      };

      setMagicPayload(payload);
    } catch (error) {
      console.log("Erros", error);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSubmit = async (values) => {
  //   console.log("hello");
  //   setIsLoading(true);
  //   console.log(user?.publicKey)
  //   if (!user?.publicKey) {
  //     toast({
  //       title: "Connect your finnie wallet",
  //       description: "You'll be re-directed to connect your finnie wallet",
  //       status: "error",
  //       duration: 3000,
  //       isClosable: true,
  //       position: "top",
  //     });
  //     setIsLoading(false);
  //     setTimeout(() => {
  //       navigate("/");
  //     }, 3000);
  //     return;
  //   }
  //   console.log("result", values);
  //   let imageLink;
  //   if (values?.image && files.length > 0) {
  //     values.image = files[0].name;
  //     const imageCID = await uploadToIPFS(files);
  //     if (imageCID === null) {
  //       setIsLoading(false);
  //       return toast({
  //         title: "Try again",
  //         description: "Error uploading image",
  //         status: "error",
  //         duration: 2000,
  //         isClosable: true,
  //         position: "top",
  //       });
  //     }
  //     imageLink = `https://${imageCID}.ipfs.dweb.link/${imageName}`;
  //   } else {
  //     imageLink = user?.linktree?.image;
  //   }

  //   values.links = insertKey(values.links);
  //   const payload = {
  //     uuid: uuid(),
  //     linktree: {
  //       ...values,
  //       image: imageLink,
  //       background: "",
  //       theme: choosenTheme,
  //       choosenLabelTheme: choosenLabelTheme,
  //     },
  //     timestamp: Date.now(),
  //   };
  //   // return;
  //   const res = await updateLinktree(
  //     payload,
  //     user?.publicKey,
  //     nodeList,
  //     values?.linktreeAddress
  //   );
  //   console.log("result", res);
  //   if (res?.message === "Proof and linktree registered successfully") {
  //     onOpen()
  //     dispatch(setUser({ publicKey: user?.publicKey, linktree: { ...values } }))
  //   } else {
  //     toast({
  //       title: "Error editing Linktree profile!",
  //       status: "error",
  //       duration: 2000,
  //       isClosable: true,
  //       position: "top",
  //     });
  //   }
  //   setIsLoading(false);
  // };

  if (isFetchingUserData)
    return (
      <Box
        height="90vh"
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Oval
          height={80}
          width={80}
          color="#ffffff"
          wrapperStyle={{}}
          wrapperClass=""
          visible={true}
          ariaLabel="oval-loading"
          secondaryColor="#ffffff"
          strokeWidth={2}
          strokeWidthSecondary={2}
          colorScheme={getRadioButtonScheme(userData?.theme)}
        />
      </Box>
    );

  const Logo = ["Gradient", "Dark"].includes(choosenTheme)
    ? "/images/DarkThemeLogo.png"
    : "/images/logo.png";
  const color = ["Gradient", "Dark"].includes(choosenTheme) ? "white" : "black";

  const linksGroup = { label: "", redirectUrl: "", key: "", isFavorite: false };
  return (
    <>
      <Box
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        padding="2rem 2rem 0 2rem"
      >
        <Link to="https://moti.bio">
          <img src={Logo} alt="main logo" style={{ height: "40px" }} />
        </Link>
        <Button
          _hover={{ color, opacity: "0.9" }}
          color={color}
          onClick={openLogoutModal}
          leftIcon={<LogOut color={color} size="20px" />}
          backgroundColor="transparent"
          width="7.8rem"
          height="2.5rem"
          borderRadius="90px"
          border={`1px solid ${color}`}
        >
          Logout
        </Button>
      </Box>
      {user?.linktree ? (
        <>
          <Flex justify="center" align="center" width="100%">
            <Box
              py={{ base: "3rem", md: "5rem" }}
              px={8}
              margin="auto"
              maxWidth={{ base: "100%", md: "800px" }}
              className="createLinktree"
            >
              <Text
                fontSize={{ base: "3xl", md: "2rem" }}
                fontWeight={"700"}
                my={5}
                color="var(--koii-create-topic)"
                fontFamily="Poppins"
                textAlign="center"
              >
                {/* <Button
                  leftIcon={
                    <ChevronLeftIcon
                      height={{ base: "20px", md: "30px" }}
                      width={{ base: "20px", md: "30px" }}
                      marginRight='-8px'
                    />
                  }
                  onClick={() => {
                    navigate(-1);
                  }}
                  variant='outline'
                  padding='0px'
                  display='flex'
                  alignItems='center'
                  justifyItems='center'
                  height={{ base: "40px", md: "50px" }}
                  width={{ base: "30px", md: "50px" }}
                  color='var(--koii-create-topic)'
                  rounded='full'
                  borderColor='var(--koii-create-topic)'
                  _hover={{
                    backgroundColor: "var(--koii-white)",
                    color: "var(--koii-create-topic)",
                  }}
                /> */}
                Edit Your Profile
              </Text>

              <Divider my={5} color="#C5C5C5" borderWidth="1px" />

              <Text
                fontSize={{ base: "xl", md: "1.2rem" }}
                fontWeight={"700"}
                fontFamily="Poppins"
                my={4}
                color="var(--koii-create-topic)"
              >
                Profile Link
              </Text>
              <LinktreeEditForm
                choosenLabelTheme={choosenLabelTheme}
                choosenTheme={choosenTheme}
                linksGroup={linksGroup}
                image={image}
                setImage={setImage}
                magicPayload={magicPayload}
                handleSubmit={handleSubmitMagic}
                userData={user?.linktree}
                isUploadingImage={isUploadingImage}
                isLoading={isLoading}
                handleLabelSelection={handleLabelSelection}
                handleThemeSelection={handleThemeSelection}
                files={files}
                getInputProps={getInputProps}
                getRootProps={getRootProps}
                colorScheme={radioColorScheme}
                setImageChanged={setImageChanged}
              />
              <MasterMagic />
            </Box>
          </Flex>
        </>
      ) : (
        <Box marginTop={"300px"}>
          <Oval
            height={80}
            width={80}
            color="#ffffff"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
            ariaLabel="oval-loading"
            secondaryColor="#ffffff"
            strokeWidth={2}
            strokeWidthSecondary={2}
            colorScheme={getRadioButtonScheme(userData?.theme)}
          />
        </Box>
      )}

      <Modal
        isCentered
        onClose={onClose}
        isOpen={isOpen}
        motionPreset="slideInBottom"
      >
        <ModalOverlay />
        <ModalContent
          maxW="29.5rem"
          width="100%"
          dropShadow="2px 7px 10px 0px #17175340"
          borderRadius="20px"
          // bgColor="#6B5FA5"
          // color="#FFFFFF"
        >
          <ModalHeader padding="0px">
            <Box
              padding="21px"
              width="100%"
              position="relative"
              justifyContent="space-between"
              justifyItems="center"
              display="flex"
              // boxShadow="0px 2px 8px 0px #00000029;"
              fontSize="20px"
              lineHeight="24px"
              fontWeight="600"
            >
              {/* <p>Login via Magic.link</p> */}
              <Button
                onClick={onClose}
                position="absolute"
                right="16px"
                top="16px"
                cursor="pointer"
                bg="transparent"
                _hover={{
                  bg: "transparent",
                }}
              >
                <X size="20px" />
              </Button>
            </Box>
          </ModalHeader>
          <ModalBody>
            <Box display="flex" justifyContent="center" alignItems="center">
              <Image src="/images/profile_claimed.png" />
            </Box>
            <Text
              fontWeight="600"
              fontSize="1.5rem"
              fontFamily="Poppins"
              color="black"
              textAlign="center"
            >
              Profile Claimed
            </Text>
            <Text
              fontWeight="400"
              my="10px"
              fontSize="0.9remrem"
              fontFamily="Poppins"
              color="black"
              textAlign="center"
            >
              Congratulations, you have successfully claimed your unique
              MOTI.BIO link ✌️
            </Text>
          </ModalBody>
          <ModalFooter>
            <Box
              width="100%"
              display="flex"
              alignItems="center"
              justifyItems="center"
              justifyContent="center"
              pb="10px"
            >
              {/* <Login /> */}
              <InputGroup>
                <Input
                  color="black"
                  disabled
                  _disabled={{
                    backgroundColor: "#D5D5D5",
                    opacity: "1",
                    border: "1px solid #D5D5D5",
                  }}
                  defaultValue={user?.linktree?.linktreeAddress}
                />
                <InputRightElement
                  onClick={() => handleCopy(user?.linktree?.linktreeAddress)}
                  cursor="pointer"
                  ml="10px"
                  mt={1}
                >
                  <Copy color="#494747" />
                </InputRightElement>
              </InputGroup>
            </Box>
            <Button
              onClick={onClose}
              fontFamily="Poppins, sans-serif"
              w="100%"
              backgroundColor={"#100E1E"}
              color={"white"}
              height="3.3rem"
              borderRadius="90px"
              // isLoading={loginState === "INITIAL"}
              _hover={{ backgroundColor: "#100E1E", opacity: "0.9" }}
              // border="1.5px solid #8989C7"
              // boxShadow="0px 4px 4px 0px #17175380"
              mt={5}
            >
              Ok
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={closeLogoutModal} />
    </>
  );
};

export default EditLinktree;
