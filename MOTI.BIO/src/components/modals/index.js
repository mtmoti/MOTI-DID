import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  // ModalCloseButton,
  Button,
  useDisclosure,
  Box,
  Image,
  Spinner,
} from "@chakra-ui/react";
// import { DOWNLOAD_FINNIE_URL } from "../../config";
import Login from "./magic/Login";
import { useWalletContext } from "../../contexts";
import { UserContext } from "../../contexts/userContext";
import { X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLinktree } from "../../api";
import { magic } from "./magic/MasterMagic";
import { getNodeList } from "../../helpers";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "../../redux/slice/userSlice";

function GetFinnieModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { magicData, userData, setUserData } = useWalletContext();
  const { isLoggedIn, isLoading } = useContext(UserContext);
  const [hasLinkTree, setHasLinkTree] = useState();
  const [linkTree, setLinkTree] = useState();
  const [, setPublicKey] = useState();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [btnText, setBtnText] = useState("Loading ...");
  const [isChecking, setIsChecking] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const user = useSelector((state) => state.user);
  const [state, setState] = useState(0);
  // console.log(user, "user")

  useEffect(() => {
    document.title = "MOTI.BIO | Login"
    setTimeout(() => {
      document.documentElement.setAttribute("data-theme", "light");
    },500);
  }, []);

  const handleFunctions = () => {
    switch (btnText) {
      case "Connect via Magic":
        return onOpen();
      case "Edit my MOTI.BIO":
        return navigate(`/edit-bio/${user?.user?.linktree?.linktreeAddress}`);
      case "Claim my MOTI.BIO":
        return navigate("/create-bio");
      default:
        return onOpen();
    }
  };

  const handleClick = () => {
    setIsChecking(true);
    // console.log()
    if (!user?.user) {
      setBtnText("Connect via Magic");
      setIsChecking(false);
      setIsChecked(true);
      return;
    }
    if (user?.user && !user?.user?.linktree) {
      setBtnText("Claim my MOTI.BIO");
      setIsChecking(false);
      setIsChecked(true);
      return;
    }
    if (user?.user && user?.user?.linktree) {
      setBtnText("Edit my MOTI.BIO");
      setIsChecking(false);
      setIsChecked(true);
      return;
    }
    // if(isLoading) return;

    // if(user?.user && user?.user?.linktree) return navigate(`/editlinktree/${linkTree?.linktreeAddress}`, { state: userData })
    // if(user?.user) navigate("/createlinktree")

    // onOpen();
  };
  useEffect(handleClick, []);

  // useEffect(() => {
  //   const getlinktreeNode = async () => {
  //    try {
  //     if(user?.user) {
  //       const metadata = await magic?.user?.getMetadata();
  //       let nodeList = await getNodeList();
  //       let pubKey  =  metadata.publicAddress
  //       const res = await getLinktree(pubKey, nodeList);
  //       if(res?.data?.data?.linktree){
  //         setUserData(res?.data?.data)
  //         const payload = {
  //           publicKey: pubKey,
  //           ...userData
  //         }
  //         dispatch(setUser(payload))
  //         setPublicKey(pubKey)
  //         setHasLinkTree(true)
  //         setLinkTree(res?.data?.data?.linktree)
  //         // buttonText = "Edit my MOTI.BIO"
  //       }
  //     }
  //    } catch (error) {
  //       console.log(error, "error")
  //    }
  //   }
  //   getlinktreeNode()
  // }, [user?.user?.linktree])

  const getButtonText = () => {
    if (isLoading) return <Spinner />;
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent={{ base: "center", md: "left" }}
        alignItems="center"
        width="100%"
      >
        <Button
          fontFamily="Sora, sans-serif"
          maxWidth="25rem"
          height={{ base: "2.6rem", md: "4rem" }}
          w={{ base: "11rem", sm: "100%" }}
          leftIcon={
            
              <Image
                height={{ base: "1rem", md: "2rem" }}
                width={{ base: "1rem", md: "2rem" }}
                src="/images/welcome-page-button-icon.png"
              />
            
          }
          background="linear-gradient(92.55deg, #AD6EEB -12.49%, #F579B5 52.69%, #FA948F 103.9%)"
          color="#232121"
          borderRadius="90px"
          isLoading={isChecking}
          // boxShadow="0px 4px 4px 0px #17175380"
          marginTop="10px"
          fontSize={{ base: "0.8rem", md: "1.5rem" }}
          // border="1.5px solid #5ED9D1"
          onClick={isChecked ? handleFunctions : handleClick}
          mb={{ base: "3rem", md: "0" }}
          _hover={{ backgroundColor: "#734C3D", opacity: "0.9" }}
          // disabled
        >
          {/* {getButtonText()} */}
          {btnText}
        </Button>
      </Box>
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
              justifyContent="center"
              justifyItems="center"
              display="flex"
              // boxShadow="0px 2px 8px 0px #00000029;"
              fontFamily="sora"
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
                {/* <svg
                  width="25"
                  height="24"
                  viewBox="0 0 36 35"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M17.8 1.39586C8.90288 1.39586 1.69591 8.60283 1.69591 17.5C1.69591 26.3972 8.90288 33.6041 17.8 33.6041C26.6972 33.6041 33.9042 26.3972 33.9042 17.5C33.9042 8.60283 26.6972 1.39586 17.8 1.39586ZM0.300049 17.5C0.300049 7.83192 8.13196 0 17.8 0C27.4681 0 35.3 7.83192 35.3 17.5C35.3 27.1681 27.4681 35 17.8 35C8.13196 35 0.300049 27.1681 0.300049 17.5Z"
                    fill="white"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M11.6661 11.5736C11.9386 11.301 12.3806 11.301 12.6531 11.5736L24.0268 22.9473C24.2994 23.2198 24.2994 23.6617 24.0268 23.9343C23.7543 24.2069 23.3124 24.2069 23.0398 23.9343L11.6661 12.5606C11.3935 12.288 11.3935 11.8461 11.6661 11.5736Z"
                    fill="white"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M24.0268 11.5736C24.2994 11.8461 24.2994 12.288 24.0268 12.5606L12.6531 23.9343C12.3806 24.2069 11.9386 24.2069 11.6661 23.9343C11.3935 23.6617 11.3935 23.2198 11.6661 22.9473L23.0398 11.5736C23.3124 11.301 23.7543 11.301 24.0268 11.5736Z"
                    fill="white"
                  />
                </svg> */}
                <X size="20px" />
              </Button>
            </Box>
          </ModalHeader>
          {/* <ModalCloseButton /> */}
          {!magicData && (
            <ModalBody display="flex" justifyContent="center">
              <img alt="magic-link-icon" src="/images/MagicLinkIcon.png" />
            </ModalBody>
          )}
          <ModalFooter>
            <Box
              width="100%"
              display="flex"
              alignItems="center"
              justifyItems="center"
              justifyContent="center"
              pb="10px"
            >
              <Login />
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default GetFinnieModal;
