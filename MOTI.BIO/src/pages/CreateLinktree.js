import React, { useState, useEffect, useContext } from "react";
import { checkForBadWords } from "../utils";
// import { Web3Storage } from "web3.storage";
// import koiiDecor from "./images/Decor 1.svg";
import LinktreeForm from "../components/form";
import { LogOut } from "lucide-react";
import {
  Box,
  Flex,
  Text,
  Image,
  Divider,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  InputGroup,
  Input,
  InputRightElement,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import uuid from "react-uuid";
import { setLinktree, getLinktreeWithUsername } from "../api";
import { useNavigate } from "react-router-dom";
import { useWalletContext } from "../contexts";
import "../css/ButtonAnimations.css";
import { createThemeApplier, getRadioButtonScheme } from "../helpers";
// import TransferTokens from "../components/modals/magic/TransferTokens";
import MasterMagic, { magic } from "../components/modals/magic/MasterMagic";
import { UserContext } from "../contexts/userContext";

import { useSelector, useDispatch } from "react-redux";
import { logoutUser, setUser } from "../redux/slice/userSlice";
import LogoutModal from "../components/LogoutModal";
import { useLogoutModalContext } from "../contexts/logoutModalContext";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import { Link } from "react-router-dom";

function trackPageView(location) {
  // ReactGA.set({ page: location.pathname });
  // ReactGA.pageview(window.location.pathname);
}

// function makeStorageClient() {
//   return new Web3Storage({
//     token:
//       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDhmOWMxOTNjODJlODMzMjVDMThkNWM4NzRCM2Q2NGM5ZjI5NDdEOUQiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODM2NTY1NzExNjEsIm5hbWUiOiJLb2lpIn0.qZJmInvmwLCkq_7T3h2gfm4Hs84MNKEVooOuAFfbIXI",
//   });
// }

const CreateLinktree = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  const [image, setImage] = useState(null);
  const [files, setFiles] = useState(null);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [, setImageName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [choosenTheme, setChoosenTheme] = useState("Mint");
  const [choosenLabelTheme, setChoosenLabelTheme] = useState("label-one");
  const [radioColorScheme, setRadioColorScheme] = useState("yellow");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [usernameError, setUsernameError] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [userName, setUserName] = useState("");
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleThemeSelection(theme) {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", theme);
    setChoosenTheme(theme);
    createThemeApplier(theme);
    const colorScheme = getRadioButtonScheme(theme);
    setRadioColorScheme(colorScheme);
  }

  const linksGroup = { label: "", redirectUrl: "", key: "", isFavorite: false };
  const toast = useToast();
  let {
    publicKey,
    apiUrl,
    nodeList,
    magicData: magicData2,
    magicPayload,
    setMagicPayload,
  } = useWalletContext();
  const { isLoggedIn, setIsLoggedIn } = useContext(UserContext);
  const {
    isOpen: isLogoutModalOpen,
    onClose: closeLogoutModal,
    onOpen: openLogoutModal,
  } = useLogoutModalContext();
  const [magicData, setMagicData] = useState(magicData2);

  // useEffect(() => {
  //   console.log("isLoggedIn: ", isLoggedIn)
  //   if(!isLoggedIn){
  //     navigate("/")
  //   }
  // }, [isLoggedIn])

  useEffect(() => {
    document.title = "Claim Your MOTI.BIO";
    setTimeout(() => {
      document.documentElement.setAttribute("data-theme", "light_create");
    }, 100);
  }, []);
  async function uploadToIPFS(image) {
    console.log(image);
    const formData = new FormData();
    formData.append("file", image);
    const url = "https://koii.pexelsoft.com/";

    try {
      setIsUploadingImage(true);
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
        setIsUploadingImage(false);
        throw new Error(`Upload failed: ${response.status} ${errorResponse}`);
      }
    } catch (error) {
      console.error("Error occurred during upload", error);
      setIsUploadingImage(false);
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

  // useEffect(() => {
  //   handleThemeSelection("Mint");
  //   async function getAuth() {
  //     const isLogged = await magic.user.isLoggedIn();
  //     if (!isLogged) {
  //       toast({
  //         title: "PLease Login to continue!",
  //         description: "You'll be re-directed Authentication page",
  //         status: "error",
  //         duration: 3000,
  //         isClosable: true,
  //         position: "top",
  //       });
  //       setTimeout(() => {
  //         navigate("/");
  //       }, 3000);
  //       return;
  //     }
  //   }
  //   getAuth();
  // }, [toast, navigate, apiUrl]);
  useEffect(() => {
    setMagicPayload(null);
  }, []);

  useEffect(() => {
    console.log(choosenTheme);
    handleThemeSelection(choosenTheme);
    // const metadata = await magic.user.getMetadata().catch(()=>{

    // });

    if (user?.user?.linktree) {
      console.log("user is lined");
      navigate(`/edit-bio/${user?.user?.linktree?.linktreeAddress}`, {
        replace: true,
      });
      return;
    }

    let publicKey = user?.user?.publicKey;
    setMagicData(publicKey);
    if (!publicKey) {
      toast({
        title: "PLease Login to continue!",
        description: "You'll be re-directed to Login page",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      return;
    }
  }, []);

  const handleSubmit = async (values, actions) => {
    try {
      setIsLoading(true);
      if (!user?.user?.publicKey) {
        toast({
          title: "Please Login To Continue",
          description: "You'll be re-directed to Login Page",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
        setIsLoading(false);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
        return;
      }
      console.log(values);
      const userData = await getLinktreeWithUsername(values.username, nodeList);
      if (userData?.data?.username) {
        toast({
          title: "This username already exists.",
          description: "Please try another username",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
        setUsernameError("Username already exists! Please choose another one.");
        setDisabled(true);
        setIsLoading(false);
        return;
      }
      const imageCID = await uploadToIPFS(files);
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

      values.links = insertKey(values.links);
      console.log(values);
      values.description = values.description.replace(/\n/g, "<br />");
      const payload = {
        uuid: uuid(),
        linktree: {
          ...values,
          image: imageCID + "/avatar.jpeg",
          background: "",
          theme: choosenTheme,
          choosenLabelTheme: choosenLabelTheme,
        },
        timestamp: Date.now(),
      };

      console.log("Setting user");

      await setLinktree(
        payload,
        user?.user?.publicKey,
        nodeList,
        values?.linktreeAddress
      );
      setUserName(values?.linktreeAddress);
      // toast({
      //   title:
      //     "Successfully created Linktree profile! Redirecting in 10 seconds...",
      //   status: "success",
      //   duration: 7000,
      //   isClosable: true,
      //   position: "top",
      // });
      // setTimeout(() => {
      //   navigate(`/${values?.linktreeAddress}`);
      // }, 10000);
    } catch (error) {
      console.log("error creating", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmitMagic = async (values, actions) => {
    // setIsLoading(true);

    console.log(image);
    let imageCID;
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
    const userData = await getLinktreeWithUsername(values.username, nodeList);
    if (userData?.data?.username) {
      toast({
        title: "This username already exists.",
        description: "Please try another username",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      setUsernameError("Username already exists! Please choose another one.");
      setDisabled(true);
      setIsLoading(false);
      return;
    }
    if (image) {
      console.log(image.size);
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
    const payload = {
      uuid: uuid(),
      linktree: {
        ...values,
        image: image ? imageCID + "/avatar.jpeg" : null,
        background: "",
        theme: choosenTheme,
        choosenLabelTheme: choosenLabelTheme,
      },
      timestamp: Date.now(),
    };

    dispatch(
      setUser({
        publicKey: user?.user?.publicKey,
        email: user?.user?.email,
        ...payload,
      })
    );

    setMagicPayload(payload);

    setIsLoading(false);
  };

  const handleChangeUserName = async (e) => {
    try {
      //adding debounce
      const userData = await getLinktreeWithUsername(e.target.value, nodeList);
      // console.log(userData.status)
      if (userData?.data?.username) {
        setUsernameError("Username already exists! Please choose another one.");
        setDisabled(true);
        return false;
      } else {
        setUsernameError(
          e.target.value.length > 5 && !checkForBadWords(e.target.value)
            ? "This username is not available"
            : ""
        );
        setDisabled(false);
        setIsValidUrl(userData.status);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleLabelSelection = (e) => {
    setChoosenLabelTheme(e);
  };
  // useEffect(() => {
  //   if (!isLoggedIn) {
  //     navigate("/")
  //   }
  // }, [isLoggedIn])

  const logout = async () => {
    try {
      // const islog = await magic.user.isLoggedIn()
      const res = await magic.user.logout();
      setIsLoggedIn(false);
      console.log(res?.data);
      dispatch(logoutUser());
      navigate("/");
    } catch (error) {
      console.log("error: ", error);
    }
    // setIsLoggedIn(false);
  };

  const color = ["Gradient", "Dark"].includes(choosenTheme) ? "white" : "black";
  const Logo = ["Gradient", "Dark"].includes(choosenTheme)
    ? "/images/DarkThemeLogo.png"
    : "/images/logo.png";

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
      <Flex justify="center" align="center" width="100%">
        <Box
          py={{ base: "2rem", md: "5rem" }}
          px={8}
          margin="auto"
          maxWidth={{ base: "100%", md: "800px" }}
          className="createLinktree"
        >
          <Flex>
            <Text
              my="5px"
              color="var(--koii-create-topic)"
              fontSize={{ base: "24px", md: "32px" }}
              fontFamily="Poppins"
              fontStyle="normal"
              fontWeight="700"
              lineHeight={{ base: "24px", md: "40px" }}
              textAlign="center"
              width="100%"
            >
              Claim Your MOTI.BIO
            </Text>
          </Flex>

          <Divider color="#C5C5C5" borderWidth="1px" />

          <Text
            fontSize={{ base: "xl", md: "xl" }}
            fontWeight="700"
            my={5}
            fontFamily="Poppins"
            color="var(--koii-create-topic)"
          >
            Profile Link
          </Text>
          {user?.user && (
            <>
              <LinktreeForm
                choosenLabelTheme={choosenLabelTheme}
                choosenTheme={choosenTheme}
                linksGroup={linksGroup}
                image={image}
                handleSubmit={handleSubmitMagic}
                isUploadingImage={isUploadingImage}
                setFiles={setFiles}
                setImage={setImage}
                setImageName={setImageName}
                handleChangeUserName={handleChangeUserName}
                usernameError={usernameError}
                isValidUrl={isValidUrl}
                disabled={disabled}
                isLoading={isLoading}
                handleLabelSelection={handleLabelSelection}
                handleThemeSelection={handleThemeSelection}
                colorScheme={radioColorScheme}
                registerLinkText={"PUBLISH"}
              />
              <MasterMagic />
            </>
          )}
        </Box>
      </Flex>

      <LogoutModal isOpen={isLogoutModalOpen} onClose={closeLogoutModal} />
    </>
  );
};

export default CreateLinktree;
