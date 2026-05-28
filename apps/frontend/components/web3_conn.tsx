import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Calendar, Copy, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

// ERC-20 ABI for token transfers (CAMP/USDT)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Camp Network Configuration \
const CAMP_NETWORK_CONFIG = {
  chainId: process.env.CAMP_CHAIN_ID, // Camp Network chain ID in hex
  chainName: 'Camp Network',
  nativeCurrency: {
    name: 'CAMP',
    symbol: 'CAMP',
    decimals: 18
  },
  rpcUrls: ['https://rpc.camp.raas.gelato.cloud'], 
  blockExplorerUrls: ['https://camp.cloud.blockscout.com']
};

// Token addresses
const TOKEN_ADDRESSES = {
  CAMP: '0xDf542583E8248fF10A26d2627575716681324bE8', // CAMP token address
  USDT: '0xDf542583E8248fF10A26d2627575716681324bE8'  // USDT token address on Camp Network
};

interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: string | null;
  isConnected: boolean;
}

interface TokenBalance {
  CAMP: string;
  USDT: string;
}

const GroupStats = ({ 
  groupData,
  memberCount, 
  totalSaved, 
  progress, 
  targetAmount,
  contributionAmount,
  contributionDueDate,
  contributionDaysLeft,
  contributionFrequency,
  payoutAmount,
  payoutRecipient,
  payoutDate
}: { 
  groupData: any;
  memberCount: number;
  totalSaved: number;
  progress: number;
  targetAmount: number;
  contributionAmount: number;
  contributionDueDate: string;
  contributionDaysLeft: number;
  contributionFrequency: string;
  payoutAmount: number;
  payoutRecipient: string;
  payoutDate: string;
}) => {
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [countdown, setCountdown] = useState(10 * 60);
  
  // Wallet states
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false
  });
  
  const [tokenBalances, setTokenBalances] = useState<TokenBalance>({
    CAMP: '0',
    USDT: '0'
  });
  
  const [selectedToken, setSelectedToken] = useState<'CAMP' | 'USDT'>('CAMP');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Format countdown time
  const formatTime = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };
  
  // Countdown timer effect
  useEffect(() => {
    if (!showContributionModal) return;
    
    setCountdown(10 * 60);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showContributionModal]);
  
  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };
  
  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask extension to continue",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      
      // Get network details
      const network = await provider.getNetwork();
      const chainId = '0x' + network.chainId.toString(16);
      
      // Get native(CAMP) balance
      const nativeBalance = await provider.getBalance(address);
      const balanceInEther = ethers.formatEther(nativeBalance);
      
      setWallet({
        address,
        balance: balanceInEther,
        chainId,
        isConnected: true
      });
      
      // Fetch token balances
      await fetchTokenBalances(address, provider);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.substring(0, 6)}...${address.substring(38)}`,
        variant: "default"
      });
      
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive"
      });
    }
  };
  
  // Switch to Camp Network
  const switchToCampNetwork = async () => {
    if (!isMetaMaskInstalled()) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CAMP_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CAMP_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error("Error adding Camp Network:", addError);
          toast({
            title: "Network Error",
            description: "Failed to add Camp Network",
            variant: "destructive"
          });
        }
      }
    }
  };
  
  // Fetch token balances
  const fetchTokenBalances = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const campContract = new ethers.Contract(TOKEN_ADDRESSES.CAMP, ERC20_ABI, provider);
      const usdtContract = new ethers.Contract(TOKEN_ADDRESSES.USDT, ERC20_ABI, provider);
      
      const [campBalance, usdtBalance, campDecimals, usdtDecimals] = await Promise.all([
        campContract.balanceOf(address),
        usdtContract.balanceOf(address),
        campContract.decimals(),
        usdtContract.decimals()
      ]);
      
      setTokenBalances({
        CAMP: campBalance ? ethers.formatUnits(campBalance, campDecimals) : '0',
        USDT: ethers.formatUnits(usdtBalance, usdtDecimals)
      });
      
    } catch (error) {
      console.error("Error fetching token balances:", error);
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    setWallet({
      address: null,
      balance: null,
      chainId: null,
      isConnected: false
    });
    setTokenBalances({
      CAMP: '0',
      USDT: '0'
    });
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
      variant: "default"
    });
  };
  
  // Handle crypto contribution
  const handleCryptoContribution = async () => {
    if (!wallet.isConnected || !wallet.address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Convert contribution amount to token amount (assuming 1:1 NGN to token rate)
      // You should implement proper conversion rate here
      const tokenAmount = contributionAmount.toString();
      
      // Get token contract
      const tokenAddress = selectedToken === 'CAMP' ? TOKEN_ADDRESSES.CAMP : TOKEN_ADDRESSES.USDT;
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      // Get decimals
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(tokenAmount, decimals);
      
      // Check balance
      const balance = await tokenContract.balanceOf(wallet.address);
      if (balance < amountInWei) {
        toast({
          title: "Insufficient Balance",
          description: `You need ${tokenAmount} ${selectedToken} to make this contribution`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // Get recipient address (this should be your group's wallet address)
      const recipientAddress = '0x...'; // Replace with actual group wallet address
      
      // Execute transfer
      const tx = await tokenContract.transfer(recipientAddress, amountInWei);
      
      toast({
        title: "Transaction Submitted",
        description: "Please wait for confirmation...",
        variant: "default"
      });
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // Transaction successful - now update your backend
        // await ContributionService.makeContribution({...});
        
        toast({
          title: "Success!",
          description: `Contribution of ${tokenAmount} ${selectedToken} completed successfully!`,
          variant: "default"
        });
        
        // Refresh token balances
        await fetchTokenBalances(wallet.address, provider);
        
        setShowContributionModal(false);
      } else {
        throw new Error("Transaction failed");
      }
      
    } catch (error: any) {
      console.error("Crypto contribution error:", error);
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to process crypto contribution",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (wallet.isConnected) {
        connectWallet();
      }
    };
    
    const handleChainChanged = () => {
      window.location.reload();
    };
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [wallet.isConnected]);

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Wallet Connection Section */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-teal-700" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Crypto Wallet</h3>
              {wallet.isConnected ? (
                <p className="text-xs text-gray-600">
                  {wallet.address?.substring(0, 6)}...{wallet.address?.substring(38)}
                </p>
              ) : (
                <p className="text-xs text-gray-600">Connect to pay with CAMP or USDT</p>
              )}
            </div>
          </div>
          
          {!wallet.isConnected ? (
            <Button 
              onClick={connectWallet}
              className="bg-teal-700 hover:bg-teal-800 text-white"
              size="sm"
            >
              Connect Wallet
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={switchToCampNetwork}
                variant="outline"
                size="sm"
              >
                Switch to Camp
              </Button>
              <Button 
                onClick={disconnectWallet}
                variant="outline"
                size="sm"
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>
        
        {wallet.isConnected && (
          <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500">Native Balance</p>
              <p className="text-sm font-medium">{parseFloat(wallet.balance || '0').toFixed(4)} CAMP</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">USDT Balance</p>
              <p className="text-sm font-medium">{parseFloat(tokenBalances.USDT).toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Existing Stats Cards */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Group Savings */}
        <div className="flex-1 bg-white rounded-md p-4">
          <h2 className="text-base font-medium mb-1">Group savings</h2>
          <p className="text-xs text-gray-500">{memberCount} members in this group</p>
          
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">₦{totalSaved.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total saved by this group</p>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress to goal</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full">
              <div className="h-full bg-green-600 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Goal: ₦{targetAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Next Contribution */}
        <div className="flex-1 bg-white rounded-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium">Next Contribution</h2>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="mb-3">
            <p className="text-2xl font-bold text-gray-900">₦{contributionAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Due on {contributionDueDate} ({contributionDaysLeft} days to go)</p>
          </div>
          
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center">
              <div className="w-5 h-5 text-xs flex items-center justify-center bg-gray-100 rounded-full mr-2">
                <Calendar className="h-3 w-3 text-gray-500" />
              </div>
              <span className="text-xs text-gray-500">Frequency</span>
              <span className="ml-auto text-xs text-gray-900">{contributionFrequency}</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-5 h-5 text-xs flex items-center justify-center bg-gray-100 rounded-full mr-2">
                <div className="h-3 w-3 text-gray-500">!</div>
              </div>
              <span className="text-xs text-gray-500">Status</span>
              <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Pending</span>
            </div>
          </div>
          
          <Button 
            className="w-full bg-teal-700 hover:bg-teal-800 text-white text-sm"
            onClick={() => setShowContributionModal(true)}
          >
            Make Contribution
          </Button>
        </div>

        {/* Next Payout */}
        <div className="flex-1 bg-white rounded-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium">Next Payout</h2>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          
          <p className="text-2xl font-bold text-gray-900 mb-4">₦{payoutAmount.toLocaleString()}</p>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs text-gray-500">Receiving Next:</span>
              <span className="ml-auto text-xs text-gray-900">{payoutRecipient}</span>
            </div>
            
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs text-gray-500">Receiving Date:</span>
              <span className="ml-auto text-xs text-gray-900">{payoutDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Modal */}
      <Dialog open={showContributionModal} onOpenChange={setShowContributionModal}>
        <DialogContent className="sm:max-w-md max-w-xl max-h-[90vh] overflow-hidden">
          <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden pr-2">

         <DialogHeader>
            <DialogTitle>Make Contribution</DialogTitle>
            <DialogDescription>
              Choose your preferred payment method: Bank transfer, Wallet, or Crypto.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3 w-full">
            <h3 className="font-medium text-base mb-2">Select Payment Method</h3>
            <div className="border-t mb-2"></div>
            
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="flex  flex-col  w-full gap-2 mb-4"
            >
              <div className="w-full flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="transfer" id="transfer" className='w-2 h-2' />
                <Label htmlFor="transfer" className="cursor-pointer flex-1">
                  <div className="font-medium">Bank Transfer</div>
                  <div className="text-xs text-gray-500">Transfer via Nigerian banks</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="cursor-pointer flex-1">
                  <div className="font-medium">Wallet Balance</div>
                  <div className="text-xs text-gray-500">Use your platform wallet</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="crypto" id="crypto" />
                <Label htmlFor="crypto" className="cursor-pointer flex-1">
                  <div className="font-medium">Crypto (CAMP/USDT)</div>
                  <div className="text-xs text-gray-500">Pay with cryptocurrency tokens</div>
                </Label>
              </div>
            </RadioGroup>
            
            {/* Bank Transfer Option */}
            {paymentMethod === 'transfer' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Transfer</p>
                  <p className="text-lg font-bold">₦{contributionAmount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">to:</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium">Polaris Bank</p>
                  <div className="flex items-center">
                    <p className="text-lg font-bold">0123456781</p>
                    <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm mt-2">Account Name</p>
                  <p className="text-sm font-medium">Charity Association Coopwise</p>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Expires in <span className="text-red-500 font-medium">{formatTime()}</span> minutes</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Wallet Option */}
            {paymentMethod === 'wallet' && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Wallet Balance</p>
                    <p className="text-lg font-bold">₦500,000</p>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Contribution Amount</p>
                    <p className="text-lg font-bold">₦{contributionAmount.toLocaleString()}</p>
                  </div>
                  
                  <div className="mb-1">
                    <p className="text-sm text-gray-600">Contribute <span className="font-bold">₦{contributionAmount.toLocaleString()}</span> to:</p>
                    <p className="text-sm font-medium">Charity Association</p>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white"
                  // onClick={handleContribution}
                >
                  Pay from Wallet
                </Button>
              </div>
            )}
            
            {/* Crypto Option */}
            {paymentMethod === 'crypto' && (
              <div className="space-y-4">
                {!wallet.isConnected ? (
                  <div className="text-center py-6">
                    <Wallet className="h-12 w-12 mx-auto mb-3 text-teal-700" />
                    <p className="text-sm text-gray-600 mb-4">Connect your wallet to pay with crypto</p>
                    <Button 
                      onClick={connectWallet}
                      className="bg-teal-700 hover:bg-teal-800 text-white"
                    >
                      Connect MetaMask
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">Connected Wallet</p>
                        <p className="text-sm font-mono">{wallet.address?.substring(0, 10)}...{wallet.address?.substring(38)}</p>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Select Token</p>
                        <RadioGroup
                          value={selectedToken}
                          onValueChange={(value) => setSelectedToken(value as 'CAMP' | 'USDT')}
                          className="flex gap-3"
                        >
                          <div className="flex items-center space-x-2 flex-1 p-3 border rounded-md">
                            <RadioGroupItem value="CAMP" id="camp-token" />
                            <Label htmlFor="camp-token" className="cursor-pointer flex-1">
                              <div className="font-medium">CAMP</div>
                              <div className="text-xs text-gray-500">{parseFloat(tokenBalances.CAMP).toFixed(2)} available</div>
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2 flex-1 p-3 border rounded-md">
                            <RadioGroupItem value="USDT" id="usdt-token" />
                            <Label htmlFor="usdt-token" className="cursor-pointer flex-1">
                              <div className="font-medium">USDT</div>
                              <div className="text-xs text-gray-500">{parseFloat(tokenBalances.USDT).toFixed(2)} available</div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">Contribution Amount</p>
                        <p className="text-lg font-bold">{contributionAmount} {selectedToken}</p>
                        <p className="text-xs text-gray-500 mt-1">≈ ₦{contributionAmount.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">To Group Wallet</p>
                        <p className="text-xs font-mono">0x...{/* Group wallet address */}</p>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      className="w-full bg-teal-700 hover:bg-teal-800 text-white"
                      onClick={handleCryptoContribution}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : `Pay ${contributionAmount} ${selectedToken}`}
                    </Button>
                    
                    <p className="text-xs text-center text-gray-500">
                      Transaction will be processed on Camp Network
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          
          {(paymentMethod === 'transfer') && (
            <DialogFooter>
              <Button 
                type="button" 
                className="w-full bg-teal-700 hover:bg-teal-800"
                // onClick={handleContribution}
              >
                Confirm Payment
              </Button>
            </DialogFooter>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupStats;