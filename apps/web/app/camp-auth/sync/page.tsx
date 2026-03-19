"use client"
import { useAuth, useAuthState } from "@campnetwork/origin/react";
import { useRouter, useSearchParams } from "next/navigation";



export default function CampAuthSync() {
  const { authenticated, loading } = useAuthState();
  const auth = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const client_id = searchParams.get("client_id");
  const userId = searchParams.get("user_id");



 return (
    <div className="">
        <p>{client_id}</p>
        <p>{userId}</p>
        <p>Wallet Address: {auth.walletAddress}</p>
        <p>User ID: {auth.userId}</p>
        <p>JWT: {auth.jwt}</p>
        <h1>Camp Auth Sync Page</h1>
    </div>
 )
}