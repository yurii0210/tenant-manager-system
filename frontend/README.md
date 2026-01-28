🏢 Tenant Management SystemA robust, React-based dashboard designed for seamless property rental management. This system provides a streamlined interface for property managers to handle lease agreements, track payment deadlines, monitor financial performance, and maintain historical records of all occupancies.
✨ Key Features
📊 Real-time Statistics: Get an instant overview of total monthly revenue, upcoming contract expirations (30-day window), and overdue payments.
🔍 Dynamic Search: Efficiently filter through tenants by name, phone number, email, or specific property address.📜 Lease Management:Create new lease agreements for vacant properties.Manage multi-tenant occupancies (Primary tenant + additional residents).Edit active contracts and update financial terms on the fly.
⚠️ Automated Status Tracking: Visual badges and alerts for contracts ending soon and overdue rental payments.history Occupancy History: Quick access to the archival history of each property to track past residents and lease terms.
✅ Smart Validation: Built-in validation for phone numbers, emails, and logical date ranges to ensure data integrity.
🚀 Tech StackLayerTechnologyFrontendReact.jsStylingTailwind CSSIconsLucide ReactDate Handlingdate-fnsAPI ClientAxios (Custom service)
🛠️ Installation & SetupClone the repository:Bashgit clone https://github.com/your-username/tenant-management.git
cd tenant-management
Install dependencies:Bashnpm install
Run the application:Bashnpm start
🔌 API IntegrationThe frontend interacts with the following backend structure:MethodEndpointDescriptionGET/propertiesFetch all properties and active tenantsGET/properties/:id/historyFetch occupancy history for a specific propertyPUT/properties/:idUpdate tenant info / Change occupancy status
👤 AuthorDeveloped by Yurii Zvirianskyi
📄 LicenseThis project is licensed under the MIT License.