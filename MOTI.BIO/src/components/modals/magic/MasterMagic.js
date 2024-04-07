import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWalletContext } from "../../../contexts";
import { Magic } from "magic-sdk";
import { SolanaExtension } from "@magic-ext/solana";
import * as web3 from "@_koi/web3.js";
import { X, Copy, ArrowUpRightFromSquare } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";

import { handleCopy } from "../../../helpers/copyText";
import { useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  useToast,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  InputLeftAddon,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Text,
  Image,
  InputGroup,
  Input,
  InputRightElement,
} from "@chakra-ui/react";
import bs58 from "bs58";
import axios from "axios";
import { setUser } from "../../../redux/slice/userSlice";
const rpcUrl = "https://testnet.koii.live";

let backend_route;

if (process.env.REACT_APP_DEVELOPMENT) {
  backend_route = `http://localhost:10000`; // when on localhost, no /task/task_id is required
} else {
  backend_route = `${process.env["REACT_APP_TASKNET_URL"]}/task/${process.env["REACT_APP_TASK_ID"]}`;
}

export const magic = new Magic("pk_live_0B806DF108602DBF", {
  extensions: {
    solana: new SolanaExtension({
      rpcUrl,
    }),
  },
});
import { Link } from "react-router-dom";

export default function MasterMagic({ handleSubmit }) {
  const { onClose, onOpen, isOpen } = useDisclosure();
  const { magicPayload, setMagicPayload } = useWalletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user);
  // const [email, ] = useState("");
  const [, setPublicAddress] = useState("");
  const dispatch = useDispatch();
  // const [destinationAddress, ] = useState(
  //   "8s15YxED2sTZn2WB7N1rhh9q5oE66JTXtJh3Aqmx9Uzp"
  // );
  // const [sendAmount, ] = useState(4000000000);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, setUserMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [txHash] = useState("");
  const [sendingTransaction] = useState(false);

  const toast = useToast();

  // useEffect(() => {
  //   magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
  //     setIsLoggedIn(magicIsLoggedIn);
  //     if (magicIsLoggedIn) {
  //       const metadata = await magic.user.getMetadata();
  //       setPublicAddress(metadata.publicAddress);
  //       setUserMetadata(metadata);
  //     }
  //   });
  // }, [isLoggedIn]);

  // const login = async () => {
  //   await magic.auth.loginWithEmailOTP({ email });
  //   setIsLoggedIn(true);
  // };

  // const logout = async () => {
  //   await magic.user.logout();
  //   setIsLoggedIn(false);
  // };

  // const handleSignTransaction = async () => {
  //   setSendingTransaction(true);
  //   const metadata = await magic.user.getMetadata();
  //   const recipientPubKey = new web3.PublicKey(destinationAddress);
  //   const payer = new web3.PublicKey(metadata.publicAddress);
  //   const connection = new web3.Connection(rpcUrl);

  //   const hash = await connection.getRecentBlockhash();

  //   let transactionMagic = new web3.Transaction({
  //     feePayer: payer,
  //     recentBlockhash: hash.blockhash,
  //   });

  //   const transaction = web3.SystemProgram.transfer({
  //     fromPubkey: payer,
  //     toPubkey: recipientPubKey,
  //     lamports: sendAmount,
  //   });

  //   transactionMagic.add(...[transaction]);

  //   const serializeConfig = {
  //     requireAllSignatures: false,
  //     verifySignatures: true,
  //   };

  //   const signedTransaction = await magic.solana.signTransaction(
  //     transactionMagic,
  //     serializeConfig
  //   );
  //   setSendingTransaction(false);

  //   setTxHash("Check your Signed Transaction in console!");

  //   console.log("Signed transaction", signedTransaction);

  //   //now time to send
  //   const tx = web3.Transaction.from(signedTransaction.rawTransaction);
  //   const signature = await connection.sendRawTransaction(tx.serialize());

  //   console.log(signature);
  // };
  useEffect(() => {
    if (magicPayload?.uuid) {
      location.pathname === "/create-bio"
        ? handleSignMessage()
        : handleUpdateSignMessage();
    }
  }, [magicPayload]);
  const handleUpdateSignMessage = async (data) => {
    try {
      setIsLoading(true);
      data = magicPayload;

      const metadata = await magic.user.getMetadata();
      const payer = new web3.PublicKey(metadata.publicAddress);

      const messageString = JSON.stringify(data);

      // Use Magic to sign the message
      const signedMessage = await magic.solana.signMessage(
        new TextEncoder().encode(messageString)
      );

      const payload = {
        data,
        publicKey: payer,
        signature: bs58.encode(signedMessage),
        username: magicPayload.linktree.linktreeAddress,
      };

      dispatch(
        setUser({
          publicKey: user?.user?.publicKey,
          email: user?.user?.email,
          ...payload?.data,
        })
      );

      let result = await axios
        .put(`${backend_route}/linktree`, { payload })
        .then((res) => res.data)
        //After 5 seconds, navigate to www.google.com
        .then((res) => {
          onOpen();
          setMagicPayload(null);
        })
        .catch((error) => {
          console.log(`Error:`, error);
          setMagicPayload(null);
          return null;
        })
        .finally(() => setIsLoading(false));

      if (result?.message) {
        return result;
      }
    } catch (error) {
      console.error("Error in handleSignMessage:", error);
    }
  };
  const handleSignMessage = async (data) => {
    try {
      setIsLoading(true);
      data = magicPayload;

      const metadata = await magic.user.getMetadata();
      const payer = new web3.PublicKey(metadata.publicAddress);

      const messageString = JSON.stringify(data);

      // Use Magic to sign the message
      const signedMessage = await magic.solana.signMessage(
        new TextEncoder().encode(messageString)
      );

      console.log(signedMessage);

      const payload = {
        data,
        publicKey: payer,
        signature: bs58.encode(signedMessage),
        username: magicPayload.linktree.linktreeAddress,
      };

      let result = await axios
        .post(`${backend_route}/linktree`, { payload })
        .then((res) => res.data)
        .then(() => {
          toast({
            title: "Profile created successfully!",
            position: "top",
            // description: "An error occured while claiming your profile",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        })
        //After 5 seconds, navigate to www.google.com
        .then((res) => {
          onOpen();
          // window.open(`/${user?.user?.linktree?.linktreeAddress}`, '_blank')
          // setMagicPayload(null);
          // let link = document.createElement("a");
          // link.href = `/${user?.user?.linktree?.linktreeAddress}`;
          // link.target = "_blank";
          // link.click();
          // link.remove();
          // setTimeout(() => {
          //   navigate(`/edit-bio/${user?.user?.linktree?.linktreeAddress}`);
          // }, 500);
          // console.log("openeing Modal")
          // onOpen()
        })
        .catch((error) => {
          console.log(`Error:`, error);
          toast({
            title: "Error",
            position: "top",
            description: "An error occured while claiming your profile",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setIsLoading(false);
          setMagicPayload(null);
          return null;
        })
        .finally(() => setIsLoading(false));

      console.log(result?.status, "statusss");

      if (result?.message) {
        return result;
      }
    } catch (error) {
      console.error("Error in handleSignMessage:", error);
    }
  };

  const handleClose = () => {
    onClose();
    if (location.pathname === "/create-bio")
      navigate(`/edit-bio/${user?.user?.linktree?.linktreeAddress}`);
  };

  const handleNavigate = () => {
    let link = document.createElement("a");
    link.href = `/${user?.user?.linktree?.linktreeAddress}`;
    link.target = "_blank";
    link.click();
    link.remove();
  };

  /*   const handleSignMessage = async () => {
    setSendingTransaction(true);
    const metadata = await magic.user.getMetadata();
    const recipientPubKey = new web3.PublicKey(destinationAddress);
    const payer = new web3.PublicKey(metadata.publicAddress);
    const connection = new web3.Connection(rpcUrl);

    const hash = await connection.getRecentBlockhash();

    let transactionMagic = new web3.Transaction({
      feePayer: payer,
      recentBlockhash: hash.blockhash,
    });

    const payload = {
      uuid: "27c2c465-f80c-488c-65b6-3834ed9b14d0",
      linktree: {
        name: "Example Test",
        description: "Test example test",
        image:
          "https: //bafybeide7e4di2yfzn7escwqwemh4beee7jzr4mwes5rqxaumrx2ckl7vu.ipfs.dweb.link/photo.jpg",
        background: "",
        links: [
          {
            label: "https: //www.youtube.com/",
            redirectUrl: "https: //www.youtube.com/",
            key: "57fb402d-276c-766c-50c0-e7e77b9d132e",
            isFavorite: true,
          },
        ],
        linktreeAddress: "testtesttets",
        theme: "Mint",
        choosenLabelTheme: "label-one",
      },
      timestamp: 1703802587522,
    };

    transactionMagic.add(payload);

    const serializeConfig = {
      requireAllSignatures: false,
      verifySignatures: true,
    };

    const signedTransaction = await magic.solana.signTransaction(
      transactionMagic,
      serializeConfig
    );
    setSendingTransaction(false);

    setTxHash("Check your Signed Transaction in console!");

    console.log("Signed transaction", signedTransaction);

    //now time to send
    const tx = web3.Transaction.from(signedTransaction.rawTransaction);
    const signature = await connection.sendRawTransaction(tx.serialize());

    console.log(signature);
  }; */

  // console.log(rest, "rest")

  return (
    <Box>
      {/* {magicPayload && (
        <>
          <Button
            onClick={
              location.pathname === "/create-bio"
                ? handleSignMessage
                : handleUpdateSignMessage
            }
            isLoading={isLoading}
            mt={5}
            color={"white"}
            bgColor={"#100E1E"}
            _hover={{ bg: "#100E1E", opacity: "0.9" }}
            // minWidth={"35%"}
            w="100%"
            height="4.125rem"
            rounded="full"
          >
            Confirm and Publish
          </Button>
          <Box mt={7}>
            <Text textAlign="center" fontWeight="700">
              {user?.user?.email}
            </Text>
            <Text textAlign="center" fontWeight="400">
              <strong>Wallet Address:</strong> {user?.user?.publicKey}
            </Text>
          </Box>
        </>
      )} */}

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
          bgColor="white"
          // color="#FFFFFF"
        >
          <ModalHeader padding="0px">
            <Box
              padding="21px"
              width="100%"
              position="relative"
              // justifyContent="space-between"
              // justifyItems="center"
              // display="flex"
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
              <Image
                alt="sucess"
                src={
                  location.pathname === "/create-bio"
                    ? "/images/profile_claimed.png"
                    : "/images/profile_update_icon.png"
                }
              />
            </Box>
            <Text
              fontWeight="600"
              fontSize="1.5rem"
              fontFamily="Poppins"
              color="black"
              textAlign="center"
            >
              {location.pathname === "/create-bio"
                ? "Profile Claimed"
                : "Profile Updated"}
            </Text>
            <Text
              fontWeight="400"
              mt="10px"
              fontSize="0.9remrem"
              fontFamily="Poppins"
              color="black"
              textAlign="center"
            >
              {location.pathname === "/create-bio" ? (
                <>
                  Congratulations, you have successfully claimed your unique
                  MOTI.BIO link ✌️
                  <br />
                  <strong>For rewards, join our </strong>
                  <Link
                    href="https://discord.gg/6bhbf7EkBZ"
                    className="llink"
                    target="_blank"
                  >
                    Community Discord
                  </Link>
                  <strong> and verify using your unique URL now!</strong>
                </>
              ) : (
                "Congratulations, you have successfully updated your profile ✌️"
              )}
            </Text>
          </ModalBody>
          <ModalFooter display="flex" flexDirection="column">
            <Box
              width="100%"
              // display="flex"
              // alignItems="center"
              // justifyItems="center"
              // justifyContent="center"
              pb="10px"
            >
              {/* <Login /> */}
              <InputGroup my="10px">
                {/* <InputLeftAddon
                  backgroundColor="#D5D5D5"
                  border="none"
                  height="3rem"
                  color="black"
                  paddingRight="0px !important"
                >
                  moti.bio/
                </InputLeftAddon> */}
                <Input
                  color="black"
                  disabled
                  // paddingLeft="0 !important"
                  _disabled={{
                    backgroundColor: "#D5D5D5",
                    opacity: "1",
                    border: "1px solid #D5D5D5",
                  }}
                  defaultValue={`moti.bio/${
                    user?.user?.linktree?.linktreeAddress ||
                    magicPayload?.linktree?.linktreeAddress
                  }`}
                />
                <InputRightElement
                  onClick={handleNavigate}
                  cursor="pointer"
                  // ml="10px"
                  mr="33px"
                  mt={1}
                >
                  <ArrowUpRightFromSquare color="#494747" />
                </InputRightElement>
                <InputRightElement
                  onClick={() =>
                    handleCopy(
                      user?.user?.linktree?.linktreeAddress ||
                        magicPayload?.linktree?.linktreeAddress,
                      toast
                    )
                  }
                  cursor="pointer"
                  ml="10px"
                  mt={1}
                >
                  <Copy color="#494747" />
                </InputRightElement>
              </InputGroup>
            </Box>
            <Button
              onClick={handleClose}
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
              // mt={5}
            >
              Ok
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
