// ImageUpload.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
	Box,
	Button,
	CircularProgress,
	Container,
	Flex,
	Heading,
	Image,
	Table,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
	Text,
	Avatar,
	useColorModeValue,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import { CloseIcon } from "@chakra-ui/icons";
import axios from "axios";
import cblogo from "./assets/potato.png";
import bgImage from "./assets/bg.png";

const ImageUpload = () => {
	const [selectedFile, setSelectedFile] = useState(null);
	const [preview, setPreview] = useState(null);
	const [data, setData] = useState(null);
	const [imageSelected, setImageSelected] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [confidence, setConfidence] = useState(0);

	const onDrop = useCallback((acceptedFiles) => {
		if (acceptedFiles.length === 0) return;
		const file = acceptedFiles[0];
		setSelectedFile(file);
		setData(null);
		setImageSelected(true);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: { "image/*": [] },
		multiple: false,
	});

	useEffect(() => {
		if (!selectedFile) {
			setPreview(null);
			return;
		}
		const objectUrl = URL.createObjectURL(selectedFile);
		setPreview(objectUrl);
		return () => URL.revokeObjectURL(objectUrl);
	}, [selectedFile]);

	useEffect(() => {
		const sendFile = async () => {
			if (!imageSelected || !selectedFile) return;
			setIsLoading(true);
			const formData = new FormData();
			formData.append("file", selectedFile);
			try {
				const res = await axios.post(import.meta.env.VITE_API_URL, formData);
				if (res.status === 200) {
					setData(res.data);
					setConfidence((parseFloat(res.data.confidence) * 100).toFixed(2));
				}
			} catch (error) {
				console.error("Error uploading file:", error);
			} finally {
				setIsLoading(false);
			}
		};
		sendFile();
	}, [preview]);

	const clearData = () => {
		setData(null);
		setImageSelected(false);
		setSelectedFile(null);
		setPreview(null);
		setConfidence(0);
	};

	const dropzoneBg = useColorModeValue("gray.100", "gray.700");

	return (
		<Box
			minH='100vh'
			minW='100dvw'
			bgImage={`url(${bgImage})`}
			bgSize='cover'
			bgPosition='center'>
			<Flex
				bg='rgba(0, 0, 0, 0.6)'
				p={6}
				px={20}
				rounded='md'
				align='center'
				justify='space-between'
				boxShadow='lg'
				backdropFilter='blur(6px)'
				mb={6}>
				<Heading size='lg' color='white'>
					Potato Disease Detector
				</Heading>
				<Avatar src={cblogo} boxSize='50px' />
			</Flex>

			<Flex minH='calc(100vh - 100px)' align='center' justify='center'>
				<Container maxW='xl' centerContent>
					<Box
						w='100%'
						h='100%'
						bg='whiteAlpha.900'
						rounded='2xl'
						boxShadow='2xl'
						align='center'
						justify='center'
						transition='all 0.3s ease-in-out'>
						{/* Upload or Preview */}
						{!imageSelected ? (
							<Flex
								{...getRootProps()}
								align='center'
								justify='center'
								h='300px'
								p={10}
								border='3px dashed'
								borderColor='gray.300'
								rounded='xl'
								cursor='pointer'
								bg={dropzoneBg}
								transition='0.2s ease'>
								<input {...getInputProps()} />
								<Text textAlign='center' color='gray.600' fontWeight='medium'>
									{isDragActive
										? "Drop the image here..."
										: "Click or drag a potato leaf image to detect disease"}
								</Text>
							</Flex>
						) : (
							<Image
								src={preview}
								alt='Preview'
								rounded='lg'
								maxH='350px'
								mx='auto'
								mb={4}
								objectFit='cover'
							/>
						)}

						{/* Loading Spinner */}
						{isLoading && (
							<Flex direction='column' align='center' mt={4}>
								<CircularProgress isIndeterminate color='pink.400' />
								<Text mt={2} color='gray.600'>
									Analyzing the image...
								</Text>
							</Flex>
						)}

						{/* Result Table */}
						{data && (
							<Box
								mt={6}
								p={4}
								borderWidth='1px'
								borderRadius='lg'
								boxShadow='md'
								bg='gray.50'>
								<Heading size='md' mb={4} color='gray.700' textAlign='center'>
									Detection Result
								</Heading>

								<Table variant='simple' size='md'>
									<Thead bg='pink.100'>
										<Tr>
											<Th textAlign='left'>Prediction</Th>
											<Th textAlign='right'>Confidence</Th>
										</Tr>
									</Thead>
									<Tbody>
										<Tr>
											<Td fontWeight='bold' color='pink.600'>
												<Text as='span' bg='pink.50' px={2} py={1} borderRadius='md'>
													{data.class}
												</Text>
											</Td>
											<Td textAlign='right' fontWeight='semibold' color='gray.700'>
												{confidence}%
											</Td>
										</Tr>
									</Tbody>
								</Table>
							</Box>
						)}

						{/* Clear Button */}
						{data && (
							<Button
								mt={6}
								colorScheme='pink'
								variant='solid'
								leftIcon={<CloseIcon />}
								onClick={clearData}
								width='full'>
								Try Another Image
							</Button>
						)}
					</Box>
				</Container>
			</Flex>
		</Box>
	);
};

export default ImageUpload;
