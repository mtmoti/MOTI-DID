import React, { useEffect, useState } from "react";
import magic from "./magic";
import { PublicKey } from "@_koi/web3.js";
import {
  Input,
  Button,
  Box,
  Text,
  Image,
  useDisclosure,
} from "@chakra-ui/react";
import { useWalletContext } from "../../../contexts";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../../redux/slice/userSlice";
import { useNavigate } from "react-router-dom";
import { getLinktree } from "../../../api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [userMetadata, setUserMetadata] = useState(null);
  const [, setWalletAddress] = useState("");
  const [loginState, setLoginState] = useState(null);
  const { onClose } = useDisclosure();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const user = useSelector((state) => state.user);

  const handleClick = () => {
    if (user?.user?.linktree)
      return navigate(`/edit-bio/${user?.user?.linktree?.linktreeAddress}`, {
        state: user?.user?.linktree,
      });

    navigate("/create-bio");
    onClose();
  };

  const {
    // magicData,
    setMagicData,
    // publicKey,
    setPublicKey,
    // magicConnection,
    setMagicConnection,
    nodeList,
  } = useWalletContext();

  const handleLogin = async () => {
    setLoginState("INITIAL");

    try {
      const magicInstance = await magic.auth.loginWithMagicLink({ email });
      const metadata = await magic.user.getMetadata();
      const userLinktree = await getLinktree(metadata.publicAddress, nodeList);

      console.log(userLinktree, "User Link Tree ==========");
      console.log(nodeList, "Node List ==========");

      if (userLinktree?.data?.data?.linktree) {
        console.log("With Link Tree");
        dispatch(
          setUser({
            publicKey: metadata.publicAddress,
            email: metadata.email,
            ...userLinktree?.data?.data,
          })
        );
      } else {
        console.log("Without Link Tree");
        dispatch(
          setUser({ publicKey: metadata.publicAddress, email: metadata.email })
        );
      }

      setMagicData(metadata);
      setPublicKey(metadata.publicAddress);
      setMagicConnection(magicInstance);
      setUserMetadata(metadata);
      fetchWalletAddress(metadata.publicAddress);
    } catch (error) {
      console.error("Failed to log in", error);
    } finally {
      setLoginState("FINAL");
    }
  };

  const fetchWalletAddress = async (publicAddress) => {
    try {
      const publicKey = new PublicKey(publicAddress);
      setWalletAddress(publicKey.toString());
      // Additional wallet functionalities can be added here
    } catch (error) {
      console.error("Error fetching wallet address", error);
    }
  };

  return (
    <>
      {!userMetadata ? (
        <Box
          width="100%"
          display={"flex"}
          flexDirection={"column"}
          alignItems={"center"}
        >
          <Text
            fontSize="0.9rem"
            width="100%"
            fontWeight="500"
            fontFamily="Poppins"
            color="black"
          >
            Enter Your Email <span style={{ color: "#FD6E6B" }}>*</span>
          </Text>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sample@moti.bio"
            borderRadius="12px"
            // w="100%"
            // bgColor={"#D5D5D5"}
            // color={"black"}
            border="1px solid #D5D5D5"
            width="100%"
            my="10px"
          />

          <Text
            fontSize="0.7rem"
            width="100%"
            fontWeight="400"
            fontFamily="Manrope"
            color="black"
            display="flex"
            gap="2px"
          >
            <span style={{ color: "#FD6E6B", fontSize: "18px" }}>*</span>
            <span>
              You need a wallet to create and manage your Decentralised Identity
              (DID) on MOTI.BIO
            </span>
          </Text>
          <Button
            onClick={handleLogin}
            fontFamily="Poppins, sans-serif"
            w="100%"
            backgroundColor={"#100E1E"}
            color={"white"}
            height="3.3rem"
            borderRadius="90px"
            isLoading={loginState === "INITIAL"}
            _hover={{ backgroundColor: "#100E1E", opacity: "0.9" }}
            // border="1.5px solid #8989C7"
            // boxShadow="0px 4px 4px 0px #17175380"
            mt={5}
          >
            Connect via Email
          </Button>
          {/* {loginState === "INITIAL" && <Spinner mt={5} />} */}
        </Box>
      ) : (
        <Box width="100%" color="black">
          <Box display="flex" justifyContent="center" alignItems="center">
            <Image src="/images/logged_in.png" />
          </Box>
          <Text
            textAlign="center"
            my="10px"
            fontFamily="Poppins"
            fontSize="1.5rem"
            fontWeight="600"
          >
            Logged in via Magic.link
          </Text>
          {/* <Text color="black" fontWeight="600">Logged in as: <br /> <span style={{ color: "var(--koii-create-topic)", fontWeight: '400' }}>{userMetadata.email}</span></Text>
          <Text color="black" mt={3} fontWeight="600">Wallet Address: <br /> <span style={{ fontSize: '0.9rem', color: "var(--koii-create-topic)", fontWeight: '400' }}>{walletAddress}</span></Text> */}
          <Button
            onClick={handleClick}
            fontFamily="Poppins, sans-serif"
            w="100%"
            backgroundColor={"#100E1E"}
            color={"white"}
            height="3.3rem"
            borderRadius="90px"
            isLoading={loginState === "INITIAL"}
            _hover={{ backgroundColor: "#100E1E", opacity: "0.9" }}
            // border="1.5px solid #8989C7"
            // boxShadow="0px 4px 4px 0px #17175380"
            mt={5}
          >
            Ok
          </Button>
        </Box>
      )}
    </>
  );
};

export default Login;
