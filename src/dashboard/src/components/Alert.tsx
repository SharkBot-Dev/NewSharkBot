"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  text: string;
  redirectUrl?: string;
}

export default function Alert({ text, redirectUrl }: Props) {
    const router = useRouter();
    useEffect(() => {
        alert(text);
        if (redirectUrl) {
            router.push(redirectUrl);
        } else {
            router.push("/dashboard");
        }
    }, [router]);

    return (
        <p>...</p>
    );
}