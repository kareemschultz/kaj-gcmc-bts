"use client";

import {
	Building2,
	Camera,
	Edit2,
	Lock,
	Mail,
	Phone,
	Save,
	Shield,
	User,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface User {
	name?: string;
	email?: string;
	image?: string;
}

interface ClientProfileProps {
	user: User;
}

export function ClientProfile({ user }: ClientProfileProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [profileData, setProfileData] = useState({
		name: user.name || "",
		email: user.email || "",
		phone: "+592-555-0123",
		company: "ABC Enterprise Ltd.",
		position: "CEO",
		address: "123 Main Street, Georgetown, Guyana",
		website: "www.abcenterprises.gy",
		taxId: "GY123456789",
		businessLicense: "BL-2024-001234",
		incorporationDate: "2020-01-15",
		industry: "Technology Services",
		employeeCount: "25-50",
		bio: "Experienced business leader focused on digital transformation and compliance excellence.",
	});

	const handleSave = () => {
		// Save profile data
		setIsEditing(false);
	};

	const handleInputChange = (field: string, value: string) => {
		setProfileData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Profile Settings
					</h1>
					<p className="text-muted-foreground">
						Manage your account information and business details
					</p>
				</div>
				<div className="flex items-center space-x-2">
					{isEditing ? (
						<>
							<Button variant="outline" onClick={() => setIsEditing(false)}>
								Cancel
							</Button>
							<Button onClick={handleSave}>
								<Save className="mr-2 h-4 w-4" />
								Save Changes
							</Button>
						</>
					) : (
						<Button onClick={() => setIsEditing(true)}>
							<Edit2 className="mr-2 h-4 w-4" />
							Edit Profile
						</Button>
					)}
				</div>
			</div>

			{/* Profile Overview */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center space-x-6">
						<div className="relative">
							<Avatar className="h-24 w-24">
								<AvatarImage src={user.image} alt={user.name || "User"} />
								<AvatarFallback className="text-lg">
									{user.name?.charAt(0)?.toUpperCase() || "U"}
								</AvatarFallback>
							</Avatar>
							{isEditing && (
								<Button
									size="icon"
									variant="outline"
									className="-bottom-2 -right-2 absolute h-8 w-8 rounded-full"
								>
									<Camera className="h-4 w-4" />
								</Button>
							)}
						</div>
						<div className="space-y-2">
							<div>
								<h2 className="font-bold text-2xl">{profileData.name}</h2>
								<p className="text-muted-foreground">{profileData.position}</p>
							</div>
							<div className="flex items-center space-x-4 text-muted-foreground text-sm">
								<div className="flex items-center space-x-1">
									<Building2 className="h-4 w-4" />
									<span>{profileData.company}</span>
								</div>
								<div className="flex items-center space-x-1">
									<Mail className="h-4 w-4" />
									<span>{profileData.email}</span>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Profile Tabs */}
			<Tabs defaultValue="personal" className="space-y-6">
				<TabsList>
					<TabsTrigger value="personal">Personal Information</TabsTrigger>
					<TabsTrigger value="business">Business Details</TabsTrigger>
					<TabsTrigger value="security">Security</TabsTrigger>
					<TabsTrigger value="preferences">Preferences</TabsTrigger>
				</TabsList>

				<TabsContent value="personal" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Personal Information</CardTitle>
							<CardDescription>
								Update your personal details and contact information
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-6 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="name">Full Name</Label>
									<Input
										id="name"
										value={profileData.name}
										onChange={(e) => handleInputChange("name", e.target.value)}
										disabled={!isEditing}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Email Address</Label>
									<Input
										id="email"
										type="email"
										value={profileData.email}
										onChange={(e) => handleInputChange("email", e.target.value)}
										disabled={!isEditing}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="phone">Phone Number</Label>
									<Input
										id="phone"
										value={profileData.phone}
										onChange={(e) => handleInputChange("phone", e.target.value)}
										disabled={!isEditing}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="position">Position</Label>
									<Input
										id="position"
										value={profileData.position}
										onChange={(e) =>
											handleInputChange("position", e.target.value)
										}
										disabled={!isEditing}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="address">Address</Label>
								<Textarea
									id="address"
									value={profileData.address}
									onChange={(e) => handleInputChange("address", e.target.value)}
									disabled={!isEditing}
									rows={3}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="bio">Bio</Label>
								<Textarea
									id="bio"
									value={profileData.bio}
									onChange={(e) => handleInputChange("bio", e.target.value)}
									disabled={!isEditing}
									rows={4}
									placeholder="Tell us about yourself..."
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="business" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Business Information</CardTitle>
							<CardDescription>
								Manage your business registration and company details
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid gap-6 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="company">Company Name</Label>
									<Input
										id="company"
										value={profileData.company}
										onChange={(e) =>
											handleInputChange("company", e.target.value)
										}
										disabled={!isEditing}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="industry">Industry</Label>
									<Input
										id="industry"
										value={profileData.industry}
										onChange={(e) =>
											handleInputChange("industry", e.target.value)
										}
										disabled={!isEditing}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="taxId">Tax ID Number</Label>
									<Input
										id="taxId"
										value={profileData.taxId}
										onChange={(e) => handleInputChange("taxId", e.target.value)}
										disabled={!isEditing}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="businessLicense">Business License</Label>
									<Input
										id="businessLicense"
										value={profileData.businessLicense}
										onChange={(e) =>
											handleInputChange("businessLicense", e.target.value)
										}
										disabled={!isEditing}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="incorporationDate">Incorporation Date</Label>
									<Input
										id="incorporationDate"
										type="date"
										value={profileData.incorporationDate}
										onChange={(e) =>
											handleInputChange("incorporationDate", e.target.value)
										}
										disabled={!isEditing}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="employeeCount">Employee Count</Label>
									<Input
										id="employeeCount"
										value={profileData.employeeCount}
										onChange={(e) =>
											handleInputChange("employeeCount", e.target.value)
										}
										disabled={!isEditing}
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="website">Company Website</Label>
								<Input
									id="website"
									value={profileData.website}
									onChange={(e) => handleInputChange("website", e.target.value)}
									disabled={!isEditing}
									placeholder="https://www.yourcompany.com"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="security" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Security Settings</CardTitle>
							<CardDescription>
								Manage your account security and authentication
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between rounded-lg border p-4">
									<div className="flex items-center space-x-3">
										<Lock className="h-5 w-5 text-muted-foreground" />
										<div>
											<h4 className="font-medium">Password</h4>
											<p className="text-muted-foreground text-sm">
												Last changed 3 months ago
											</p>
										</div>
									</div>
									<Button variant="outline">Change Password</Button>
								</div>

								<div className="flex items-center justify-between rounded-lg border p-4">
									<div className="flex items-center space-x-3">
										<Shield className="h-5 w-5 text-muted-foreground" />
										<div>
											<h4 className="font-medium">Two-Factor Authentication</h4>
											<p className="text-muted-foreground text-sm">
												Add an extra layer of security to your account
											</p>
										</div>
									</div>
									<Button variant="outline">Setup 2FA</Button>
								</div>

								<div className="flex items-center justify-between rounded-lg border p-4">
									<div className="flex items-center space-x-3">
										<User className="h-5 w-5 text-muted-foreground" />
										<div>
											<h4 className="font-medium">Login Sessions</h4>
											<p className="text-muted-foreground text-sm">
												Manage your active login sessions
											</p>
										</div>
									</div>
									<Button variant="outline">View Sessions</Button>
								</div>
							</div>

							<Separator />

							<div className="space-y-4">
								<h4 className="font-medium text-red-600">Danger Zone</h4>
								<div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
									<div>
										<h4 className="font-medium">Delete Account</h4>
										<p className="text-muted-foreground text-sm">
											Permanently delete your account and all data
										</p>
									</div>
									<Button variant="destructive">Delete Account</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="preferences" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Notification Preferences</CardTitle>
							<CardDescription>
								Choose how you want to receive notifications
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-medium">Email Notifications</h4>
									<p className="text-muted-foreground text-sm">
										Receive updates via email
									</p>
								</div>
								<Button variant="outline">Configure</Button>
							</div>
							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-medium">SMS Notifications</h4>
									<p className="text-muted-foreground text-sm">
										Receive urgent alerts via SMS
									</p>
								</div>
								<Button variant="outline">Configure</Button>
							</div>
							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-medium">Push Notifications</h4>
									<p className="text-muted-foreground text-sm">
										Browser and mobile push notifications
									</p>
								</div>
								<Button variant="outline">Configure</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Data & Privacy</CardTitle>
							<CardDescription>
								Control your data and privacy settings
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-medium">Data Export</h4>
									<p className="text-muted-foreground text-sm">
										Download a copy of your data
									</p>
								</div>
								<Button variant="outline">Export Data</Button>
							</div>
							<div className="flex items-center justify-between">
								<div>
									<h4 className="font-medium">Privacy Policy</h4>
									<p className="text-muted-foreground text-sm">
										Review our privacy policy and terms
									</p>
								</div>
								<Button variant="outline">View Policy</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
