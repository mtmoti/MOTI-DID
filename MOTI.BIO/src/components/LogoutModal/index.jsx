import React, { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Box,
  Button,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { magic } from "../modals/magic/MasterMagic";
import { logoutUser } from "../../redux/slice/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const LogoutModal = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      setIsLoading(true);
      await magic.user.logout();
      dispatch(logoutUser());
      navigate("/login", { replace: true });
      onClose();
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isCentered onClose={onClose} isOpen={isOpen} motionPreset="slideInBottom" backgroundColor="white">
        <ModalOverlay />
        <ModalContent
          maxW="29.5rem"
          width="100%"
          dropShadow="2px 7px 10px 0px #17175340"
          borderRadius="20px"
          bgColor="white">
          <ModalHeader padding="0px">
            <Box
              padding="21px"
              width="100%"
              position="relative"
              justifyContent="space-between"
              justifyItems="center"
              display="flex"
              fontSize="20px"
              lineHeight="24px"
              fontWeight="600">
              <Button
                onClick={onClose}
                position="absolute"
                right="16px"
                top="16px"
                cursor="pointer"
                bg="transparent"
                _hover={{
                  bg: "transparent",
                }}>
                <X size="20px" />
              </Button>
            </Box>
          </ModalHeader>
          <ModalBody>
            <Text color="black" fontFamily="Poppins" fontSize="1.5rem" textAlign="center" fontWeight="600">
              Logout
            </Text>
            <Text
              color="black"
              fontFamily="Poppins"
              fontSize="0.9rem"
              textAlign="center"
              fontWeight="400"
              my="15px"
              mb="10px">
              Any unsaved changes will be discarded. <br />
              Are you sure you want to logout?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Box
              width="100%"
              display="flex"
              alignItems="center"
              justifyItems="center"
              justifyContent="center"
              flexDirection="column"
              pb="10px">
              <Button
                onClick={logout}
                fontFamily="Poppins, sans-serif"
                w="100%"
                backgroundColor={"#100E1E"}
                color={"white"}
                height="3.3rem"
                borderRadius="90px"
                isLoading={isLoading}
                _hover={{ backgroundColor: "#100E1E", opacity: "0.9" }}
                // border="1.5px solid #8989C7"
                // boxShadow="0px 4px 4px 0px #17175380"
                // mt={2}
              >
                Logout
              </Button>
              <Box
                color="black"
                cursor="pointer"
                onClick={onClose}
                fontFamily="Poppins"
                fontSize="1rem"
                fontWeight="600"
                mt="20px">
                Close
              </Box>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LogoutModal;
