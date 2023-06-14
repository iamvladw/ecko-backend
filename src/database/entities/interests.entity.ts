import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ObjectIdColumn,
    ObjectId
} from 'typeorm';

@Entity({ name: 'interests_groups' })
export class MySQLInterestGroup {
    @PrimaryGeneratedColumn()
        id: number;

    @Column()
        uuid: string;

    @Column()
        name: string;

    @Column()
        description: string;

    @Column({ type: 'json' })
        interests: string[];
}

@Entity({ name: 'interests' })
export class MySQLInterest {
    @PrimaryGeneratedColumn()
        id: number;

    @Column()
        uuid: string;

    @Column()
        name: string;

    @Column()
        description: string;

    @Column({ type: 'json' })
        followers: string[];

    @Column()
        group: string;
}

@Entity({ name: 'interests_groups' })
export class MongoDBInterestGroup {
    @ObjectIdColumn()
        _id: ObjectId;

    @Column()
        uuid: string;

    @Column()
        name: string;

    @Column()
        description: string;

    @Column({ type: 'json' })
        interests: string[];
}

@Entity({ name: 'interests' })
export class MongoDBInterest {
    @ObjectIdColumn()
        _id: ObjectId;

    @Column()
        uuid: string;

    @Column()
        name: string;

    @Column()
        description: string;

    @Column({ type: 'json' })
        followers: string[];

    @Column()
        group: string;
}
