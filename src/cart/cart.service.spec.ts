import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CartService', () => {
  let service: CartService;
  let prisma: { cartItem: any; product: any };

  beforeEach(async () => {
    prisma = {
      cartItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        delete: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('adds a product to the cart with the requested quantity', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'product-1', price: 10 });
    prisma.cartItem.findFirst.mockResolvedValue(null);
    prisma.cartItem.create.mockResolvedValue({ id: 'cart-item-1', productId: 'product-1', quantity: 2 });

    const result = await service.addItem('user-1', { productId: 'product-1', quantity: 2 });

    expect(prisma.cartItem.create).toHaveBeenCalled();
    expect(result.message).toBe('Product added to cart successfully');
  });
});
