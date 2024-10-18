import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import {
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { hasSubscription } from "@/utils/stripe";



const PricingCard = async ({
  tier,

  index,
}: {
  tier: {
    name: string;
    price: string;
    features: string[];
  };
  index: number;
}) =>  {

  const subscribed = await hasSubscription();
  return (
    <Card key={index} className={index === 1 ? "border-primary" : ""}>
      <CardHeader>
        <CardTitle className="text-2xl">{tier.name}</CardTitle>
        <CardDescription className="text-3xl font-bold">
          {tier.price}
          <span className="text-base font-normal">/month</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {tier.features.map((feature, fIndex) => (
            <li key={fIndex} className="flex items-center">
              <CheckIcon className="h-5 w-5 text-primary mr-2" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {index === 0 ? (
          <RegisterLink
            className={buttonVariants({
              variant: "outline",
            })}
          >
            Get started
          </RegisterLink>
        ) : (
          <LoginLink
          aria-disabled
            className={buttonVariants({
              variant: "default",
            })}
            
          >
            {subscribed ? 
            (
              <>
               Already Owned 
              </>
            ) : (
              <>Upgrade to Pro</>
            )}
          </LoginLink>
        )}
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
