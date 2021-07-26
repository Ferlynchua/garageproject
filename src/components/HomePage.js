import React, { useState, useEffect } from "react";
import { Contract, getDefaultProvider, providers, utils } from "ethers";
import { config } from "../config";
import abi from "../fixtures/abi.json";
import axios from "axios";

const provider = getDefaultProvider("rinkeby", { alchemy: config.alchemyKey });
const contract = new Contract(
    "0x4598fB92A934d348113e9D6924b4A8C2b75a917F",
    abi,
    provider
);

const formatIpfsUrl = (url) => {
    // get the numbers of the image after the last slash
    console.log("url " + url);

    var n = url.lastIndexOf('/');
    var result = url.substring(n + 1);
    console.log("the numbers :  " + result);

    // get the last digit of the number if 10 will be 0 , 11 will be 1 , 12 will be 2
    var lastdigit = url.slice(-1);
    console.log("he last digit : " + lastdigit);

    var imagename = '';
    var url1 = '';

    // check if the numbers lengh equal to 2 then 
    if (result.length === 2) {
        // get the url path only before the number 
        url1 = url.substring(0, url.length - 2);
        console.log("url without number : " + url1);
        imagename = url1 + lastdigit;
        console.log("url with number : " + imagename);
    } else if (result.length === 3) {
        // get the url path only before the number 
        url1 = url.substring(0, url.length - 3);
        console.log("url without number : " + url1);
        imagename = url1 + lastdigit;
        console.log("url with number : " + imagename);
    }
    else {
        imagename = url;

    }

    return imagename.replace(/ipfs:\/\//g, "https://cloudflare-ipfs.com/");


};

const formatIpfsUrlImage = (url) => {
    return url.replace(/ipfs:\/\//g, "https://cloudflare-ipfs.com/");
};

export const HomePage = () => {
    const [mintedNftState, setMintedNftState] = useState({
        state: "UNINITIALIZED",
    });

    const [purchaseState, setPurchaseState] = useState({
        state: "UNINITIALIZED",
    });
    const modalVisible =
        purchaseState.state === "PENDING_METAMASK" ||
        purchaseState.state === "PENDING_SIGNER" ||
        purchaseState.state === "PENDING_CONFIRMAION";

    const loadRobotsData = async () => {
        setMintedNftState({
            state: "PENDING",
        });
        const totalSupply = await contract.totalSupply();
        console.log("Total Supply : " + totalSupply);
        // totalSupply = 3
        const ids = [...Array(totalSupply.toNumber()).keys()];
        // ids = [0, 1, 2]

        console.log("deferredData : " + ids);

        //ids.length =11;

        const deferredData = ids.map(async (id) => {
            const ipfsUri = await contract.tokenURI(id);
            const owner = await contract.ownerOf(id);
            const formattedUri = formatIpfsUrl(ipfsUri);
            const metadata = (await axios.get(formattedUri)).data;
            const formattedImage = formatIpfsUrlImage(metadata.image);
            return {
                id,
                name: metadata.name,
                image: formattedImage,
                description: metadata.description,
                owner,
            };
        });
        const data = await Promise.all(deferredData);
        console.log("NFT DATA:", data);
        setMintedNftState({
            state: "SUCCESS",
            data,
        });
    };

    useEffect(() => {
        loadRobotsData();
    }, []);


    const viewDetail = async () => {
        console.log("view detail");

        alert("Hello, I am owned by:{owner} ");
        return (
            <div id="overlay">
                <div>
                    <p>Content you want the user to see goes here.</p>
                </div>
            </div>
        );


    };

    const handlePurchase = async () => {

        const { ethereum } = window;
        if (typeof ethereum == "undefined") alert("Metamask is not detected");

        // Prompts Metamask to connect
        setPurchaseState({ state: "PENDING_METAMASK" });
        await ethereum.enable();

        // Create new provider from Metamask
        const provider = new providers.Web3Provider(window.ethereum);

        // Get the signer from Metamask
        const signer = provider.getSigner();

        const contract = new Contract(
            "0x4598fB92A934d348113e9D6924b4A8C2b75a917F",
            abi,
            signer
        );

        // Call the purchase method
        setPurchaseState({ state: "PENDING_SIGNER" });
        try {
            const receipt = await contract.purchase({ value: utils.parseEther("1") })
            setPurchaseState({ state: "PENDING_CONFIRMAION" });
            const transaction = await receipt.wait();
            setPurchaseState({ state: "SUCCESS", transaction });
            console.log(transaction);
        } catch (err) {
            console.log(err);
            return setPurchaseState({ state: "UNINITIALIZED" });
        }

        // Reload the Robots
        await loadRobotsData();
    };

    return (
        //<div className="min-h-screen bg-gradient-to-b from-pink-400 via-pink-300 to-pink-200 ">
        <div className="min-h-screen bg-repeat bg-hk-ribbon">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 ">
                <div className="text-pink-200 text-8xl pt-8 pb-10 border -2 border-dashed border-white bg-indigo-300" >Hello Kitty
                    <div class="border-0 border-solid float-left">
                        <img src="https://gateway.pinata.cloud/ipfs/QmQxxBXFHKZ4kSopFtM37Wdb37uxDEgo7jfWo6bsN9Wbw2/icons/hearts.gif" />
                    </div>
                </div>

                <div className="text-blue-700  text-1xl pt-10 pb-1 ">Hello Kitty was born in the suburbs of London. She lives with her parents and her twin sister Mimmy who is her best friend. Her hobbies include baking cookies and making new friends. As she always says, "You can never have too many friends, so bring some home with you today!"</div>

                <div className="mt-12">
                    <button
                        onClick={handlePurchase}
                        type="button"
                        className="inline-flex items-center px-6 py-3 border-8 text-base font-medium rounded-md shadow-sm text-blue-800 bg-purple-300 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 pointer font-sans"
                    >
                        Be my friend!
                    </button>
                </div>

                {mintedNftState.state === "PENDING" && (
                    <div className="text-xl text-white">LOADING...</div>
                )}
                {mintedNftState.state === "SUCCESS" && (
                    <div className="grid grid-cols-3 gap-4">
                        {mintedNftState.data.map(
                            ({ id, image, name, description, owner }) => {

                                return (
                                    <div key={id} className="bg-white rounded p-2 border-double border-4 border-purple-500 hover:border-yellow-300 mt-12">
                                        <img src={image} className="mx-auto p-4" alt={name} />
                                        <div className="text-xl">{name}</div>
                                        <div className="">{description}</div>
                                        <hr className="my-4" />
                                        <div className="text-left text-sm">Serial No: {id + 1}</div>

                                        <div className="text-left text-sm">Owned By:</div>
                                        <div className="text-left text-xs">{owner}</div>
                                        <div className="mt-12">
                                            <button
                                                onClick={viewDetail}
                                                type="button"
                                                value={owner}
                                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-pink-300 hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                            >
                                                Know more about me!
                                            </button>


                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </div>




            {modalVisible && (
                <div
                    className="fixed z-10 inset-0 overflow-y-auto"
                    aria-labelledby="modal-title"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            aria-hidden="true"
                        />
                        <span
                            className="hidden sm:inline-block sm:align-middle sm:h-screen"
                            aria-hidden="true"
                        >

                        </span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
                            <div>
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                                    <svg
                                        className="h-6 w-6 text-yellow-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                </div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3
                                        className="text-lg leading-6 font-medium text-gray-900"
                                        id="modal-title"
                                    >
                                        {purchaseState.state === "PENDING_METAMASK" &&
                                            "Connecting Metamask..."}
                                        {purchaseState.state === "PENDING_SIGNER" &&
                                            "Waiting for Signed Transaction"}
                                        {purchaseState.state === "PENDING_CONFIRMAION" &&
                                            "Waiting for Block Confirmation"}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            {purchaseState.state === "PENDING_METAMASK" &&
                                                "Allow Metamask to connect to this application in the extension."}
                                            {purchaseState.state === "PENDING_SIGNER" &&
                                                "Approve the purchase transaction within the Metamask extension"}
                                            {purchaseState.state === "PENDING_CONFIRMAION" &&
                                                "Transaction has been sent to the blockchain. Please wait while the transaction is being confirmed."}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>


            )}
        </div>


    );
};