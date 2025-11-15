"use client";

import { Building2, Mail, Phone, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function ProfilePage() {
	const utils = trpc.useUtils();
	const { data: profile, isLoading } = trpc.portal.profile.useQuery();

	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");

	useEffect(() => {
		if (profile) {
			setName(profile.user.name || "");
			setPhone(profile.user.email || "");
		}
	}, [profile]);

	const updateProfileMutation = trpc.portal.updateProfile.useMutation({
		onSuccess: () => {
			toast.success("Profile updated successfully");
			utils.portal.profile.invalidate();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update profile");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateProfileMutation.mutate({ name, phone });
	};

	return (
		<div className="container mx-auto space-y-6 p-6">
			<div className="space-y-2">
				<h1 className="font-bold text-3xl">My Profile</h1>
				<p className="text-muted-foreground">
					Manage your account information and preferences
				</p>
			</div>

			{isLoading ? (
				<div className="space-y-4">
					<Skeleton className="h-48 w-full" />
					<Skeleton className="h-48 w-full" />
				</div>
			) : !profile ? (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">Failed to load profile</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 lg:grid-cols-2">
					{/* User Information */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-5 w-5" />
								Personal Information
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Your name"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<Input
											id="email"
											value={profile.user.email}
											disabled
											className="bg-muted"
										/>
									</div>
									<p className="text-muted-foreground text-xs">
										Email cannot be changed
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="phone">Phone</Label>
									<div className="flex items-center gap-2">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<Input
											id="phone"
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
											placeholder="Your phone number"
										/>
									</div>
								</div>

								<Button
									type="submit"
									disabled={updateProfileMutation.isPending}
									className="w-full"
								>
									<Save className="mr-2 h-4 w-4" />
									Save Changes
								</Button>
							</form>
						</CardContent>
					</Card>

					{/* Client Businesses */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building2 className="h-5 w-5" />
								My Businesses
							</CardTitle>
						</CardHeader>
						<CardContent>
							{profile.clients.length === 0 ? (
								<p className="text-center text-muted-foreground">
									No businesses associated
								</p>
							) : (
								<div className="space-y-4">
									{profile.clients.map((client) => (
										<div key={client.id} className="rounded-lg border p-4">
											<div className="mb-2 flex items-start justify-between">
												<div className="flex-1">
													<p className="font-medium">{client.name}</p>
													<p className="text-muted-foreground text-sm">
														{client.email}
													</p>
													{client.phone && (
														<p className="text-muted-foreground text-sm">
															{client.phone}
														</p>
													)}
												</div>
												<Badge>{client.type}</Badge>
											</div>

											{client.businesses && client.businesses.length > 0 && (
												<div className="mt-3 space-y-2 border-t pt-3">
													<p className="font-medium text-sm">
														Associated Businesses:
													</p>
													{client.businesses.map((business) => (
														<div
															key={business.id}
															className="rounded-md bg-muted p-2 text-sm"
														>
															<p className="font-medium">{business.name}</p>
															{business.ein && (
																<p className="text-muted-foreground">
																	EIN: {business.ein}
																</p>
															)}
															{business.address && (
																<p className="text-muted-foreground">
																	{business.address}
																</p>
															)}
														</div>
													))}
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
