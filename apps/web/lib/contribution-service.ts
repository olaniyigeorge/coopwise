

import { z } from 'zod';
import AuthService from './auth-service';

export const CreateContributionSchema = z.object({
  user_id: z.string().uuid(),
  group_id: z.string().uuid(),
  amount: z.number(),
  currency: z.string().length(3),
  due_date: z.string(), // or z.date().optional()
  note: z.string(),
  status: z.enum(['pledged', 'completed']),
});

export type CreateContributionSchema = z.infer<typeof CreateContributionSchema>;


const ContributionService = {
    

    
    async makeContribution(payload: CreateContributionSchema) {
        const token = await AuthService.getToken();
      
        if (!token) {
          throw new Error('You must be logged in to make a contribution');
        }
        const res = await fetch('/api/v1/contributions', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });
    
        if (!res.ok) throw new Error('Failed to make contribution');
    
        return res.json();
    }
}


export default ContributionService;